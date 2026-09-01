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
  createCheckoutSession: createStripeCheckoutSession,
  verifyWebhookEvent,
  isSessionPaid,
} = require('./lib/billing/providers/stripe');
const { createAutopayPayment, handleAutopayItn } = require('./lib/billing/providers/autopay');
const { generateAssistantToken, assistantSaveMatch } = require('./lib/assistant');
const {
  generateCaptainToken,
  revokeCaptainToken,
  getCaptainForm,
  submitCaptainRoster,
  uploadCaptainTeamPhoto,
  acceptCaptainRoster,
  rejectCaptainRoster,
} = require('./lib/captain');
const {
  billingSecrets,
  emailSecrets,
  stripeSecrets,
  autopaySecrets,
  autopayWebhookSecrets,
  getPaymentProvider,
  getStripeSecretKey,
  getStripeWebhookSecret,
} = require('./lib/params');

function resolveDatabaseUrl() {
  const explicit = process.env.FIREBASE_DATABASE_URL || process.env.DATABASE_URL;
  if (explicit) return explicit;
  const projectId = process.env.GCLOUD_PROJECT || process.env.PROJECT_ID || 'turniejprosaas';
  return `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
}

admin.initializeApp({
  databaseURL: resolveDatabaseUrl(),
});
const db = admin.database();

const region = 'europe-west1';

function toHttpsError(err) {
  const allowed = ['invalid-argument', 'not-found', 'failed-precondition', 'permission-denied'];
  const code = allowed.includes(err.code) ? err.code : 'internal';
  return new functions.https.HttpsError(code, err.message || 'Błąd serwera.');
}

function resolveWebhookProvider(req) {
  const explicit = String(req.query.provider || req.headers['x-payment-provider'] || '').toLowerCase();
  if (explicit) return explicit;
  if (req.headers['stripe-signature']) return 'stripe';
  const body = req.body || {};
  if (body.transactions || body.Transactions) return 'autopay';
  return getPaymentProvider();
}

function requireCheckoutConsent(data) {
  if (!data?.termsAccepted || !data?.withdrawalConsent) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Wymagana akceptacja regulaminów przed płatnością.',
    );
  }
}

exports.activateLicense = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Wymagane uprawnienia administratora.');
  }

  const key = String(data?.key || '').trim();
  const forceNewPeriod = data?.grantNewPeriod === true;
  try {
    return await activateLicenseByKey(db, key, { forceNewPeriod });
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.getProductCatalog = functions.region(region).https.onCall(async (data) => {
  const app = String(data?.app || '').trim().toLowerCase();
  const all = getActiveProducts();
  const products = app ? all.filter((p) => (p.app || 'turniejomat') === app) : all;
  return { products: products.map(productToPublic) };
});

exports.createCheckoutSession = functions
  .runWith({ secrets: [...autopaySecrets, ...stripeSecrets] })
  .region(region)
  .https.onCall(async (data) => {
    const productId = String(data?.productId || '').trim();
    const app = String(data?.app || '').trim().toLowerCase() || undefined;
    const customerEmail = String(data?.email || data?.customerEmail || '').trim() || undefined;

    if (!productId) {
      throw new functions.https.HttpsError('invalid-argument', 'Wymagane productId.');
    }
    if (app && app !== 'turniejomat' && app !== 'setka') {
      throw new functions.https.HttpsError('invalid-argument', 'Nieobsługiwane app. Użyj: turniejomat lub setka.');
    }

    requireCheckoutConsent(data);

    try {
      const provider = getPaymentProvider();
      const consent = {
        termsAccepted: data.termsAccepted === true,
        withdrawalConsent: data.withdrawalConsent === true,
        termsVersion: String(data?.termsVersion || '').trim() || null,
      };
      if (provider === 'stripe') {
        return await createStripeCheckoutSession({ productId, app, customerEmail, ...consent });
      }
      return await createAutopayPayment(db, { productId, app, customerEmail, ...consent });
    } catch (err) {
      console.error('createCheckoutSession error:', err.type || err.code, err.message);
      throw toHttpsError(err);
    }
  });

exports.getCheckoutStatus = functions.region(region).https.onCall(async (data) => {
  const orderId = String(data?.orderId || '').trim();
  const paymentId = String(data?.paymentId || '').trim() || orderId;
  if (!paymentId) {
    throw new functions.https.HttpsError('invalid-argument', 'Wymagane orderId lub paymentId.');
  }

  const orderSnap = await db.ref('zamowienia/' + paymentId).once('value');
  const order = orderSnap.val();
  if (!order) {
    const pendingSnap = await db.ref('platnosci_oczekujace/' + paymentId).once('value');
    const pending = pendingSnap.val();
    if (!pending) {
      return { found: false, status: 'unknown' };
    }
    return {
      found: true,
      app: pending.app || null,
      status: pending.status || 'pending',
      paymentStatus: pending.paymentStatus || null,
      productId: pending.productId || null,
      completed: false,
    };
  }

  const isSetka = (order.app === 'setka') || String(order.productId || '').startsWith('setka-');
  const response = {
    found: true,
    app: order.app || (isSetka ? 'setka' : 'turniejomat'),
    status: order.status || 'completed',
    productId: order.productId || null,
    customerEmail: order.customerEmail || null,
    paymentId,
    completed: order.status === 'completed',
    emailSent: order.emailSent === true,
    until: order.until || null,
    hours: order.hours || null,
    redeemBy: order.redeemBy || null,
    validityText: order.validityText || null,
  };
  if (isSetka && order.status === 'completed') {
    response.licenseKey = order.licenseKey || null;
    response.licenseKeyMasked = order.licenseKeyMasked || null;
  }
  return response;
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

exports.generateCaptainToken = functions.region(region).https.onCall(async (data) => {
  const key = String(data?.key || '').trim();
  const teamId = data?.teamId;
  if (!key || teamId === undefined || teamId === null || teamId === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Wymagane key i teamId.');
  }
  try {
    return await generateCaptainToken(db, key, teamId, data?.noteEmail);
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.revokeCaptainToken = functions.region(region).https.onCall(async (data) => {
  const key = String(data?.key || '').trim();
  const teamId = data?.teamId;
  if (!key || teamId === undefined || teamId === null || teamId === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Wymagane key i teamId.');
  }
  try {
    return await revokeCaptainToken(db, key, teamId);
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.getCaptainForm = functions.region(region).https.onCall(async (data) => {
  try {
    return await getCaptainForm(db, data || {});
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.submitCaptainRoster = functions.region(region).https.onCall(async (data) => {
  try {
    return await submitCaptainRoster(db, data || {});
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.uploadCaptainTeamPhoto = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .region(region)
  .https.onCall(async (data) => {
    try {
      return await uploadCaptainTeamPhoto(db, data || {});
    } catch (err) {
      throw toHttpsError(err);
    }
  });

exports.acceptCaptainRoster = functions.region(region).https.onCall(async (data) => {
  try {
    return await acceptCaptainRoster(db, data || {});
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.rejectCaptainRoster = functions.region(region).https.onCall(async (data) => {
  try {
    return await rejectCaptainRoster(db, data || {});
  } catch (err) {
    throw toHttpsError(err);
  }
});

exports.paymentWebhook = functions
  .runWith({ secrets: [...autopayWebhookSecrets, ...billingSecrets] })
  .region(region)
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const provider = resolveWebhookProvider(req);

    if (provider === 'autopay') {
      try {
        const result = await handleAutopayItn(db, req, fulfillOrder, handlePaymentFailure);
        if (result.contentType) res.set('Content-Type', result.contentType);
        res.status(result.status).send(result.body);
      } catch (err) {
        console.error('Autopay ITN error:', err);
        res.status(500).send('ITN handler failed');
      }
      return;
    }

    if (provider === 'p24' || provider === 'przelewy24') {
      res.status(501).json({
        error: 'Not implemented',
        message: 'Przelewy24 bezpośrednio — użyj Autopay (obsługuje BLIK i przelewy).',
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
