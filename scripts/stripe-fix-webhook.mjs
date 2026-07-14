/**
 * 1. Utwórz / zaktualizuj webhook Stripe (test mode)
 * 2. Odtwórz brakujące zamówienia z checkout.session.completed
 *
 * Wymaga: STRIPE_SECRET_KEY w env lub functions config
 * Dla RTDB: GOOGLE_APPLICATION_CREDENTIALS lub ADC (firebase login)
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

const WEBHOOK_URL = 'https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook';
const EVENT = 'checkout.session.completed';

function loadStripeKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  try {
    const { execSync } = require('child_process');
    execSync('firebase experiments:enable legacyRuntimeConfigCommands', { cwd: root, stdio: 'ignore' });
    const out = execSync('firebase functions:config:get stripe.secret_key --json', { cwd: root, encoding: 'utf8' });
    const parsed = JSON.parse(out);
    if (parsed?.result) return parsed.result;
    const full = JSON.parse(execSync('firebase functions:config:get --json', { cwd: root, encoding: 'utf8' }));
    return full?.result?.stripe?.secret_key || full?.stripe?.secret_key;
  } catch {
    return null;
  }
}

async function main() {
  const stripeKey = loadStripeKey();
  if (!stripeKey) {
    console.error('Brak STRIPE_SECRET_KEY');
    process.exit(1);
  }

  const stripe = require(join(root, 'functions/node_modules/stripe'))(stripeKey);

  console.log('=== Stripe webhook setup ===');
  const existing = await stripe.webhookEndpoints.list({ limit: 20 });
  let endpoint = existing.data.find((e) => e.url === WEBHOOK_URL);

  if (endpoint) {
    endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
      enabled_events: [EVENT],
      disabled: false,
    });
    console.log('Zaktualizowano endpoint:', endpoint.id);
  } else {
    endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [EVENT],
      description: 'Turniejomat paymentWebhook (Firebase)',
    });
    console.log('Utworzono endpoint:', endpoint.id);
    console.log('NOWY_SIGNING_SECRET=' + endpoint.secret);
  }

  const events = await stripe.events.list({
    type: EVENT,
    limit: 10,
  });

  console.log('\n=== Ostatnie checkout.session.completed ===');
  if (!events.data.length) {
    console.log('Brak zdarzeń — webhook gotowy na przyszłe płatności.');
    return;
  }

  const admin = require(join(root, 'functions/node_modules/firebase-admin'));
  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL: 'https://turniejprosaas-default-rtdb.europe-west1.firebasedatabase.app',
    });
  }
  const db = admin.database();
  const { fulfillOrder } = require(join(root, 'functions/lib/billing/fulfillOrder.js'));
  const { parseCheckoutSession } = require(join(root, 'functions/lib/billing/providers/stripe.js'));

  for (const ev of events.data) {
    const session = ev.data.object;
    const paymentId = session.id;
    const snap = await db.ref('zamowienia/' + paymentId).once('value');
    if (snap.val()) {
      console.log('OK już w bazie:', paymentId, '→', snap.val().licenseKey);
      continue;
    }
    if (session.payment_status !== 'paid') {
      console.log('Pominięto (nieopłacone):', paymentId);
      continue;
    }
    const order = parseCheckoutSession(session);
    const result = await fulfillOrder(db, order);
    console.log('Odtworzono:', paymentId, '→', result.key, result.alreadyProcessed ? '(duplicate)' : '');
  }

  console.log('\nGotowe.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
