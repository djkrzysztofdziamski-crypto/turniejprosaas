/**
 * Diagnostyka createCheckoutSession (bez wypisywania kluczy).
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

function loadConfig() {
  const { execSync } = require('child_process');
  execSync('firebase experiments:enable legacyRuntimeConfigCommands', { cwd: root, stdio: 'ignore' });
  const stripe = JSON.parse(execSync('firebase functions:config:get stripe --json', { cwd: root, encoding: 'utf8' }));
  return stripe.result || {};
}

async function trySession(stripe, label, params) {
  try {
    const session = await stripe.checkout.sessions.create(params);
    console.log(`OK [${label}]:`, session.id, session.url?.slice(0, 60) + '...');
    return true;
  } catch (err) {
    console.log(`FAIL [${label}]:`, err.type || 'error', '-', err.message);
    if (err.raw?.param) console.log('  param:', err.raw.param);
    return false;
  }
}

async function main() {
  const cfg = loadConfig();
  const key = cfg.secret_key;
  if (!key) {
    console.error('Brak stripe.secret_key');
    process.exit(1);
  }
  console.log('Tryb:', key.startsWith('sk_live_') ? 'LIVE' : 'TEST');
  console.log('');

  const stripe = require(join(root, 'functions/node_modules/stripe'))(key);
  const base = {
    mode: 'payment',
    customer_email: 'test@example.com',
    line_items: [{
      price_data: {
        currency: 'pln',
        unit_amount: 7900,
        product_data: { name: 'Test Turniejomat' },
      },
      quantity: 1,
    }],
    success_url: 'https://app.turniejomat.pl/?checkout=success',
    cancel_url: 'https://turniejomat.pl/#cennik',
    metadata: { productId: 'football-weekend' },
  };

  await trySession(stripe, 'card+blik+p24', { ...base, payment_method_types: ['card', 'blik', 'p24'] });
  await trySession(stripe, 'card only', { ...base, payment_method_types: ['card'] });
  await trySession(stripe, 'card+p24', { ...base, payment_method_types: ['card', 'p24'] });
  await trySession(stripe, 'card+blik', { ...base, payment_method_types: ['card', 'blik'] });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
