const { getProduct, resolveProductId } = require('../catalog');
const {
  getStripeSecretKey,
  getStripeWebhookSecret,
  getPaymentMethodTypes,
  getAppUrls,
  getSetkaUrls,
} = require('../../params');

function getStripeClient() {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) return null;
  return require('stripe')(stripeSecretKey);
}

function parseCheckoutSession(session) {
  const productId = resolveProductId({
    productId: session.metadata?.productId,
    package: session.metadata?.package,
    app: session.metadata?.app,
  });
  const email = session.customer_email || session.customer_details?.email || '';
  const product = getProduct(productId);
  const notatka = email
    ? `Stripe: ${email} (${product?.label || productId})`
    : `Stripe: ${product?.label || productId}`;

  return {
    app: session.metadata?.app || product?.app || 'turniejomat',
    productId,
    notatka,
    source: 'stripe',
    paymentId: session.id,
    customerEmail: email || null,
    paymentStatus: session.payment_status || null,
  };
}

function isSessionPaid(session) {
  return session.payment_status === 'paid';
}

async function createCheckoutSession({ productId, app, customerEmail }) {
  const stripe = getStripeClient();
  if (!stripe) {
    const err = new Error('Stripe nie jest skonfigurowany.');
    err.code = 'failed-precondition';
    throw err;
  }

  const product = getProduct(productId);
  if (!product || !product.active) {
    const err = new Error('Nieznany lub nieaktywny produkt.');
    err.code = 'invalid-argument';
    throw err;
  }

  const targetApp = String(app || product.app || 'turniejomat').toLowerCase();
  if (product.app && product.app !== targetApp) {
    const err = new Error('Produkt nie należy do wskazanej aplikacji.');
    err.code = 'invalid-argument';
    throw err;
  }

  const { appUrl, landingUrl } = getAppUrls();
  const setkaUrls = getSetkaUrls();
  const setkaThankYouUrl = setkaUrls.landingUrl.endsWith('.html')
    ? setkaUrls.landingUrl.replace(/\.html$/i, '-dziekujemy.html')
    : setkaUrls.landingUrl.replace(/\/$/, '') + '/dziekujemy.html';
  const successUrl = targetApp === 'setka'
    ? setkaThankYouUrl
    : `${appUrl}/?checkout=success`;
  const cancelUrl = targetApp === 'setka'
    ? `${setkaUrls.landingUrl}`
    : `${landingUrl}/#cennik`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail || undefined,
    payment_method_types: getPaymentMethodTypes(),
    line_items: [{
      price_data: {
        currency: 'pln',
        unit_amount: product.priceGrosze,
        product_data: {
          name: product.label,
          metadata: { productId: product.id },
        },
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      app: targetApp,
      productId: product.id,
      package: product.duration === 'miesiac' ? 'miesiac' : 'weekend',
    },
  });

  return { url: session.url, sessionId: session.id };
}

function verifyWebhookEvent(req, stripe) {
  const stripeWebhookSecret = getStripeWebhookSecret();
  const sig = req.headers['stripe-signature'];
  return stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
}

module.exports = {
  getStripeClient,
  parseCheckoutSession,
  createCheckoutSession,
  verifyWebhookEvent,
  isSessionPaid,
};
