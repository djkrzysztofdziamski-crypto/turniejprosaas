/**
 * Turniejomat — Cloud Functions
 * Billing: createCheckoutSession, paymentWebhook, getProductCatalog
 * Licensing: activateLicense
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { activateLicenseByKey } = require('./lib/licensing');
const { getActiveProducts, productToPublic } = require('./lib/billing/catalog');
const { fulfillOrder } = require('./lib/billing/fulfillOrder');
const {
  getStripeClient,
  parseCheckoutSession,
  createCheckoutSession,
  verifyWebhookEvent,
} = require('./lib/billing/providers/stripe');

admin.initializeApp();
const db = admin.database();

function toHttpsError(err) {
  const allowed = ['invalid-argument', 'not-found', 'failed-precondition', 'permission-denied'];
  const code = allowed.includes(err.code) ? err.code : 'internal';
  return new functions.https.HttpsError(code, err.message || 'Błąd serwera.');
}

exports.activateLicense = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Wymagane uprawnienia administratora.');
  }

  const key = String(data?.key || '').trim();
  try {
    return await activateLicenseByKey(db, key);
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.getProductCatalog = functions.region('europe-west1').https.onCall(async () => {
  return { products: getActiveProducts().map(productToPublic) };
});

exports.createCheckoutSession = functions.region('europe-west1').https.onCall(async (data) => {
  const productId = String(data?.productId || '').trim();
  const customerEmail = String(data?.email || data?.customerEmail || '').trim() || undefined;

  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Wymagane productId.');
  }

  try {
    return await createCheckoutSession({ productId, customerEmail });
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.paymentWebhook = functions.region('europe-west1').https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const provider = String(req.query.provider || req.headers['x-payment-provider'] || 'stripe').toLowerCase();

  if (provider === 'p24' || provider === 'przelewy24') {
    res.status(501).json({
      error: 'Not implemented',
      message: 'Przelewy24: patrz docs/PAYMENTS.md',
    });
    return;
  }

  const stripe = getStripeClient();
  const stripeWebhookSecret = functions.config().stripe?.webhook_secret;

  if (!stripe || !stripeWebhookSecret) {
    res.status(503).json({
      error: 'Stripe not configured',
      message: 'Ustaw firebase functions:config:set stripe.secret_key="..." stripe.webhook_secret="..."',
    });
    return;
  }

  let event;
  try {
    event = verifyWebhookEvent(req, stripe);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const order = parseCheckoutSession(event.data.object);
      const result = await fulfillOrder(db, order);
      console.log('Order fulfilled:', result.key, order.paymentId, result.email);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('paymentWebhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});
