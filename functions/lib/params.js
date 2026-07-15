/**
 * Parametry środowiska Cloud Functions (zamiast functions.config()).
 * Sekrety: firebase functions:secrets:set
 * Stringi: plik functions/.env.turniejprosaas lub domyślne wartości
 */
const { defineSecret, defineString } = require('firebase-functions/params');

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const smtpPass = defineSecret('SMTP_PASS');

const stripePaymentMethodTypes = defineString('STRIPE_PAYMENT_METHOD_TYPES', {
  default: 'card,blik',
  description: 'Metody płatności Stripe (CSV), np. card,blik,p24',
});

const appUrl = defineString('APP_URL', {
  default: 'https://app.turniejomat.pl',
});

const appLandingUrl = defineString('APP_LANDING_URL', {
  default: 'https://turniejomat.pl',
});

const smtpHost = defineString('SMTP_HOST', {
  default: '',
  description: 'Host SMTP (np. mx.hosti24.pl, smtp-relay.brevo.com)',
});

const smtpPort = defineString('SMTP_PORT', {
  default: '587',
});

const smtpUser = defineString('SMTP_USER', {
  default: '',
});

const smtpSecure = defineString('SMTP_SECURE', {
  default: 'false',
});

const emailFrom = defineString('EMAIL_FROM', {
  default: 'Turniejomat <noreply@turniejomat.pl>',
});

const emailReplyTo = defineString('EMAIL_REPLY_TO', {
  default: 'admin@turniejomat.pl',
});

const paymentProvider = defineString('PAYMENT_PROVIDER', {
  default: 'autopay',
  description: 'Provider płatności: autopay | stripe',
});

const autopaySharedKey = defineSecret('AUTOPAY_SHARED_KEY');
const autopayServiceId = defineString('AUTOPAY_SERVICE_ID', {
  default: '',
  description: 'ServiceID nadany przez Autopay',
});

const autopayGatewayUrl = defineString('AUTOPAY_GATEWAY_URL', {
  default: 'https://pay.autopay.eu',
  description: 'URL bramki Autopay (prod: pay.autopay.eu, test: testpay.autopay.eu)',
});

/** Sekrety wymagane przy checkout + webhook + email (Stripe legacy) */
const billingSecrets = [stripeSecretKey, stripeWebhookSecret, smtpPass, autopaySharedKey];

/** Sekrety wymagane przy wysyłce maili */
const emailSecrets = [smtpPass];

/** Sekrety wymagane przy checkout Stripe */
const stripeSecrets = [stripeSecretKey];

/** Sekrety wymagane przy checkout / ITN Autopay */
const autopaySecrets = [autopaySharedKey];

/** ITN Autopay + email z kluczem */
const autopayWebhookSecrets = [autopaySharedKey, smtpPass];

function getPaymentMethodTypes() {
  const raw = stripePaymentMethodTypes.value();
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['card', 'blik'];
}

function getStripeSecretKey() {
  return stripeSecretKey.value() || '';
}

function getStripeWebhookSecret() {
  return stripeWebhookSecret.value() || '';
}

function getEmailConfig() {
  return {
    smtp_host: smtpHost.value(),
    smtp_port: smtpPort.value(),
    smtp_user: smtpUser.value(),
    smtp_pass: smtpPass.value(),
    smtp_secure: smtpSecure.value(),
    from: emailFrom.value(),
    reply_to: emailReplyTo.value(),
  };
}

function getAppUrls() {
  return {
    appUrl: appUrl.value(),
    landingUrl: appLandingUrl.value(),
  };
}

function getPaymentProvider() {
  return String(paymentProvider.value() || 'autopay').toLowerCase();
}

function getAutopayServiceId() {
  return String(autopayServiceId.value() || '').trim();
}

function getAutopaySharedKey() {
  return autopaySharedKey.value() || '';
}

function getAutopayGatewayUrl() {
  return String(autopayGatewayUrl.value() || 'https://pay.autopay.eu').trim();
}

module.exports = {
  stripeSecretKey,
  stripeWebhookSecret,
  smtpPass,
  autopaySharedKey,
  billingSecrets,
  emailSecrets,
  stripeSecrets,
  autopaySecrets,
  autopayWebhookSecrets,
  getPaymentMethodTypes,
  getStripeSecretKey,
  getStripeWebhookSecret,
  getEmailConfig,
  getAppUrls,
  getPaymentProvider,
  getAutopayServiceId,
  getAutopaySharedKey,
  getAutopayGatewayUrl,
};
