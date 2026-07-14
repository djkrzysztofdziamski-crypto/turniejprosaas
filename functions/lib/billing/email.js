const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const APP_URL = 'https://app.turniejomat.pl';

function getEmailConfig() {
  return functions.config().email || {};
}

function getTransporter() {
  const cfg = getEmailConfig();
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) return null;

  const port = Number(cfg.smtp_port || 587);
  const secure = cfg.smtp_secure === 'true' || port === 465;

  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port,
    secure,
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_pass,
    },
    tls: { minVersion: 'TLSv1.2' },
    requireTLS: !secure,
  });
}

function buildLicenseEmailHtml({ licenseKey, productLabel, expiresAt }) {
  const expiryStr = expiresAt
    ? new Date(expiresAt).toLocaleString('pl-PL')
    : '—';
  const appLink = `${APP_URL}/?id=${encodeURIComponent(licenseKey)}`;

  return `
<!DOCTYPE html>
<html lang="pl">
<body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 560px;">
  <h2 style="color: #0052cc;">Turniejomat — Twój klucz licencyjny</h2>
  <p>Dziękujemy za zakup <strong>${productLabel}</strong>.</p>
  <p style="font-size: 16px;">Twój klucz licencyjny:</p>
  <p style="font-size: 22px; font-weight: bold; font-family: ui-monospace, monospace; background: #f1f5f9; padding: 14px 18px; border-radius: 8px; letter-spacing: 0.04em;">${licenseKey}</p>
  <p>Licencja ważna do: <strong>${expiryStr}</strong></p>
  <p style="margin: 24px 0;">
    <a href="${appLink}" style="display:inline-block;background:#137333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
      Wejdź do turnieju
    </a>
  </p>
  <p style="font-size: 13px; color: #64748b;">
    Możesz też wpisać klucz ręcznie na <a href="${APP_URL}">${APP_URL}</a><br>
    Pytania: <a href="mailto:admin@turniejomat.pl">admin@turniejomat.pl</a>
  </p>
  <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Turniejomat © 2026 · powered by TurniejPro</p>
</body>
</html>`;
}

function buildLicenseEmailText({ licenseKey, productLabel, expiresAt }) {
  const expiryStr = expiresAt
    ? new Date(expiresAt).toLocaleString('pl-PL')
    : '—';
  const appLink = `${APP_URL}/?id=${encodeURIComponent(licenseKey)}`;

  return [
    'Turniejomat — Twój klucz licencyjny',
    '',
    `Dziękujemy za zakup ${productLabel}.`,
    '',
    `Klucz: ${licenseKey}`,
    `Ważny do: ${expiryStr}`,
    '',
    `Wejdź do aplikacji: ${appLink}`,
    '',
    'Pytania: admin@turniejomat.pl',
  ].join('\n');
}

async function sendLicenseEmail({ to, licenseKey, productLabel, expiresAt }) {
  if (!to) {
    return { sent: false, reason: 'no_recipient' };
  }

  const cfg = getEmailConfig();
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email skipped — brak konfiguracji email.smtp_* w functions config');
    return { sent: false, reason: 'not_configured' };
  }

  const from = cfg.from || 'Turniejomat <noreply@turniejomat.pl>';
  const payload = { licenseKey, productLabel, expiresAt };

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: cfg.reply_to || 'admin@turniejomat.pl',
      subject: `Turniejomat — klucz licencyjny ${licenseKey}`,
      text: buildLicenseEmailText(payload),
      html: buildLicenseEmailHtml(payload),
    });
    console.log('License email sent to', to, licenseKey);
    return { sent: true };
  } catch (err) {
    console.error('sendLicenseEmail error:', err.message);
    return { sent: false, reason: err.message || 'send_failed' };
  }
}

async function verifyEmailTransport() {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, reason: 'not_configured' };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || 'verify_failed' };
  }
}

module.exports = { sendLicenseEmail, verifyEmailTransport };
