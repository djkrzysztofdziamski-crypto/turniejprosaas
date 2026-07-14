/**
 * Wyślij ostatnie checkout.session.completed do paymentWebhook (podpis Stripe).
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

const WEBHOOK_URL = 'https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook';
const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeKey || !webhookSecret) {
  console.error('Ustaw STRIPE_SECRET_KEY i STRIPE_WEBHOOK_SECRET');
  process.exit(1);
}

const stripe = require(join(root, 'functions/node_modules/stripe'))(stripeKey);

const events = await stripe.events.list({ type: 'checkout.session.completed', limit: 5 });
if (!events.data.length) {
  console.log('Brak zdarzeń do wysłania.');
  process.exit(0);
}

for (const ev of events.data) {
  const payload = JSON.stringify(ev);
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': sig },
    body: payload,
  });
  const text = await res.text();
  console.log(ev.id, sessionId(ev), '→', res.status, text.slice(0, 120));
}

function sessionId(ev) {
  return ev.data?.object?.id || '?';
}
