const functions = require('firebase-functions');
const { getProduct, resolveProductId } = require('../catalog');

function getStripeClient() {
  const stripeSecretKey = functions.config().stripe?.secret_key;
  if (!stripeSecretKey) return null;
  return require('stripe')(stripeSecretKey);
}

function parseCheckoutSession(session) {
  const productId = resolveProductId({
    productId: session.metadata?.productId,
    package: session.metadata?.package,
  });
  const email = session.customer_email || session.customer_details?.email || '';
  const product = getProduct(productId);
  const notatka = email
    ? `Stripe: ${email} (${product?.label || productId})`
    : `Stripe: ${product?.label || productId}`;

  return {
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

function getPaymentMethodTypes() {
  const raw = functions.config().stripe?.payment_method_types;
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  // p24 wymaga osobnej aktywacji w Stripe Live (Settings → Payment methods)
  return ['card', 'blik'];
}

async function createCheckoutSession({ productId, customerEmail }) {
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

  const appUrl = functions.config().app?.url || 'https://app.turniejomat.pl';
  const landingUrl = functions.config().app?.landing_url || 'https://turniejomat.pl';

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
    success_url: `${appUrl}/?checkout=success`,
    cancel_url: `${landingUrl}/#cennik`,
    metadata: {
      productId: product.id,
      package: product.duration === 'miesiac' ? 'miesiac' : 'weekend',
    },
  });

  return { url: session.url, sessionId: session.id };
}

function verifyWebhookEvent(req, stripe) {
  const stripeWebhookSecret = functions.config().stripe?.webhook_secret;
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
