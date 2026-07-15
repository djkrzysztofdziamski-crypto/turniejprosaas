/**
 * Audyt webhooków Stripe (bez wypisywania sekretów).
 * Używa stripe.secret_key z Firebase config lub STRIPE_SECRET_KEY.
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

const EXPECTED_URL = 'https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook';
const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
];

function loadStripeKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  const { execSync } = require('child_process');
  try {
    execSync('firebase experiments:enable legacyRuntimeConfigCommands', { cwd: root, stdio: 'ignore' });
    const full = JSON.parse(execSync('firebase functions:config:get stripe --json', { cwd: root, encoding: 'utf8' }));
    return full?.result?.secret_key || full?.result?.stripe?.secret_key || full?.stripe?.secret_key || null;
  } catch {
    return null;
  }
}

async function main() {
  const stripeKey = loadStripeKey();
  if (!stripeKey) {
    console.error('Brak stripe.secret_key (Firebase config lub STRIPE_SECRET_KEY).');
    process.exit(1);
  }

  const mode = stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN';
  console.log('=== Stripe webhook audit ===');
  console.log('Tryb klucza API:', mode);
  console.log('Oczekiwany URL:', EXPECTED_URL);
  console.log('');

  const stripe = require(join(root, 'functions/node_modules/stripe'))(stripeKey);
  const { data: endpoints } = await stripe.webhookEndpoints.list({ limit: 20 });

  if (!endpoints.length) {
    console.log('Brak webhooków w tym trybie Stripe.');
    process.exit(1);
  }

  let ok = false;
  for (const ep of endpoints) {
    const match = ep.url === EXPECTED_URL;
    if (match) ok = true;
    const missing = REQUIRED_EVENTS.filter((e) => !ep.enabled_events.includes(e));
    const extra = ep.enabled_events.filter((e) => !REQUIRED_EVENTS.includes(e));

    console.log(`--- ${ep.id} ${match ? '(TWÓJ ENDPOINT)' : ''} ---`);
    console.log('URL:', ep.url, ep.url === EXPECTED_URL ? 'OK' : 'INNY');
    console.log('Status:', ep.status, ep.disabled ? '(disabled)' : '(enabled)');
    console.log('Zdarzenia wymagane:', REQUIRED_EVENTS.every((e) => ep.enabled_events.includes(e)) ? 'OK' : 'BRAKUJE');
    if (missing.length) console.log('  Brakuje:', missing.join(', '));
    console.log('Wszystkie zdarzenia:', ep.enabled_events.join(', ') || '(brak)');
    if (extra.length) console.log('  Dodatkowe:', extra.join(', '));
    console.log('');
  }

  if (!ok) {
    console.log('UWAGA: Brak webhooka z oczekiwanym URL w trybie', mode);
    process.exit(1);
  }

  console.log('Podsumowanie: sprawdź powyżej czy URL i 3 zdarzenia są OK.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
