/**
 * Turniejomat — Cloud Functions
 * Billing: createCheckoutSession, paymentWebhook, getProductCatalog
 * Licensing: activateLicense
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { activateLicenseByKey } = require('./lib/licensing');
const { getActiveProducts, productToPublic } = require('./lib/billing/catalog');
const { fulfillOrder } = require('./lib/billing/fulfillOrder');
const { handlePaymentFailure } = require('./lib/billing/handlePaymentFailure');
const { resendOrderEmail } = require('./lib/billing/resendOrderEmail');
const { verifyEmailTransport } = require('./lib/billing/email');
const {
  getStripeClient,
  parseCheckoutSession,
  createCheckoutSession,
  verifyWebhookEvent,
  isSessionPaid,
} = require('./lib/billing/providers/stripe');
const { generateAssistantToken, assistantSaveMatch } = require('./lib/assistant');
const {
  billingSecrets,
  emailSecrets,
  stripeSecrets,
  getStripeSecretKey,
  getStripeWebhookSecret,
} = require('./lib/params');

admin.initializeApp();
const db = admin.database();

const region = 'europe-west1';

function toHttpsError(err) {
  const allowed = ['invalid-argument', 'not-found', 'failed-precondition', 'permission-denied'];
  const code = allowed.includes(err.code) ? err.code : 'internal';
  return new functions.https.HttpsError(code, err.message || 'Błąd serwera.');
}

exports.activateLicense = functions.region(region).https.onCall(async (data, context) => {
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

exports.getProductCatalog = functions.region(region).https.onCall(async () => {
  return { products: getActiveProducts().map(productToPublic) };
});

exports.createCheckoutSession = functions
  .runWith({ secrets: stripeSecrets })
  .region(region)
  .https.onCall(async (data) => {
    const productId = String(data?.productId || '').trim();
    const customerEmail = String(data?.email || data?.customerEmail || '').trim() || undefined;

    if (!productId) {
      throw new functions.https.HttpsError('invalid-argument', 'Wymagane productId.');
    }

    try {
      return await createCheckoutSession({ productId, customerEmail });
    } catch (err) {
      console.error('createCheckoutSession error:', err.type || err.code, err.message);
      throw toHttpsError(err);
    }
  });

exports.resendOrderEmail = functions
  .runWith({ secrets: emailSecrets })
  .region(region)
  .https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Wymagane uprawnienia administratora.');
    }

    const paymentId = String(data?.paymentId || '').trim();
    if (!paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Wymagane paymentId.');
    }

    try {
      return await resendOrderEmail(db, paymentId);
    } catch (err) {
      throw toHttpsError(err);
    }
  });

exports.verifyEmailConfig = functions
  .runWith({ secrets: emailSecrets })
  .region(region)
  .https.onCall(async (_data, context) => {
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Wymagane uprawnienia administratora.');
    }
    return verifyEmailTransport();
  });

exports.generateAssistantToken = functions.region(region).https.onCall(async (data) => {
  const key = String(data?.key || '').trim();
  if (!key) {
    throw new functions.https.HttpsError('invalid-argument', 'Wymagany klucz licencji.');
  }
  try {
    return await generateAssistantToken(db, key);
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.assistantSaveMatch = functions.region(region).https.onCall(async (data) => {
  try {
    return await assistantSaveMatch(db, data || {});
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.paymentWebhook = functions
  .runWith({ secrets: billingSecrets })
  .region(region)
  .https.onRequest(async (req, res) => {
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
    const stripeWebhookSecret = getStripeWebhookSecret();

    if (!stripe || !stripeWebhookSecret) {
      res.status(503).json({
        error: 'Stripe not configured',
        message: 'Ustaw secrety STRIPE_SECRET_KEY i STRIPE_WEBHOOK_SECRET (patrz docs/PAYMENTS.md)',
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
      const session = event.data.object;

      if (event.type === 'checkout.session.completed') {
        if (!isSessionPaid(session)) {
          console.log(
            'Checkout completed, payment unpaid — czekam na async:',
            session.id,
            session.payment_status,
          );
        } else {
          const order = parseCheckoutSession(session);
          const result = await fulfillOrder(db, order);
          console.log('Order fulfilled:', result.key, order.paymentId, result.email);
        }
      } else if (event.type === 'checkout.session.async_payment_succeeded') {
        const order = parseCheckoutSession(session);
        const result = await fulfillOrder(db, order);
        console.log('Async payment fulfilled:', result.key, order.paymentId, result.email);
      } else if (event.type === 'checkout.session.async_payment_failed') {
        await handlePaymentFailure(db, session);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('paymentWebhook handler error:', err);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });
