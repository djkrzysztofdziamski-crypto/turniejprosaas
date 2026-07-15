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

/** Sekrety wymagane przy checkout + webhook + email */
const billingSecrets = [stripeSecretKey, stripeWebhookSecret, smtpPass];

/** Sekrety wymagane przy wysyłce maili */
const emailSecrets = [smtpPass];

/** Sekrety wymagane przy checkout Stripe */
const stripeSecrets = [stripeSecretKey];

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

module.exports = {
  stripeSecretKey,
  stripeWebhookSecret,
  smtpPass,
  billingSecrets,
  emailSecrets,
  stripeSecrets,
  getPaymentMethodTypes,
  getStripeSecretKey,
  getStripeWebhookSecret,
  getEmailConfig,
  getAppUrls,
};
