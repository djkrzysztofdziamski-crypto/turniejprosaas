/**
 * Turniejomat — Cloud Functions
 * - activateLicense: callable (panel admina)
 * - paymentWebhook: Stripe (+ placeholder Przelewy24)
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {
  KEY_RE,
  activateLicenseByKey,
  createAndActivateLicense,
} = require('./lib/licensing');

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

exports.paymentWebhook = functions.region('europe-west1').https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const provider = String(req.query.provider || req.headers['x-payment-provider'] || 'stripe').toLowerCase();

  if (provider === 'p24' || provider === 'przelewy24') {
    res.status(501).json({
      error: 'Not implemented',
      message: 'Przelewy24: ustaw functions.config().p24 i zaimplementuj weryfikację CRC — patrz docs/PAYMENTS.md',
    });
    return;
  }

  const stripeWebhookSecret = functions.config().stripe?.webhook_secret;
  const stripeSecretKey = functions.config().stripe?.secret_key;

  if (!stripeWebhookSecret || !stripeSecretKey) {
    res.status(503).json({
      error: 'Stripe not configured',
      message: 'Ustaw firebase functions:config:set stripe.secret_key="..." stripe.webhook_secret="..."',
    });
    return;
  }

  const stripe = require('stripe')(stripeSecretKey);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const typ = session.metadata?.package === 'miesiac' ? 'miesiac' : 'weekend';
      const email = session.customer_email || session.customer_details?.email || '';
      const notatka = email ? `Stripe: ${email}` : 'Stripe checkout';

      const result = await createAndActivateLicense(db, {
        typ,
        notatka,
        source: 'stripe',
        paymentId: session.id,
      });

      console.log('License issued via Stripe:', result.key, session.id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('paymentWebhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});
