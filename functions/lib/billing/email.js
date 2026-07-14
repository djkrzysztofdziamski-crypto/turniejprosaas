const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

function getTransporter() {
  const cfg = functions.config().email || {};
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) return null;

  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port || 587),
    secure: cfg.smtp_secure === 'true',
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_pass,
    },
  });
}

function buildLicenseEmailHtml({ licenseKey, productLabel, expiresAt }) {
  const expiryStr = expiresAt
    ? new Date(expiresAt).toLocaleString('pl-PL')
    : '—';

  return `
<!DOCTYPE html>
<html lang="pl">
<body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <h2 style="color: #0052cc;">Turniejomat — Twój klucz licencyjny</h2>
  <p>Dziękujemy za zakup <strong>${productLabel}</strong>.</p>
  <p style="font-size: 18px;">Twój klucz:</p>
  <p style="font-size: 22px; font-weight: bold; font-family: monospace; background: #f1f5f9; padding: 12px 16px; border-radius: 8px;">${licenseKey}</p>
  <p>Licencja ważna do: <strong>${expiryStr}</strong></p>
  <p>
    <a href="https://app.turniejomat.pl" style="display:inline-block;background:#137333;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
      Wejdź do aplikacji
    </a>
  </p>
  <p style="font-size: 13px; color: #64748b;">Wpisz klucz na stronie logowania. W razie pytań: admin@turniejomat.pl</p>
</body>
</html>`;
}

async function sendLicenseEmail({ to, licenseKey, productLabel, expiresAt }) {
  if (!to) {
    return { sent: false, reason: 'no_recipient' };
  }

  const cfg = functions.config().email || {};
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email skipped — brak konfiguracji email.smtp_* w functions config');
    return { sent: false, reason: 'not_configured' };
  }

  const from = cfg.from || 'Turniejomat <noreply@turniejomat.pl>';

  await transporter.sendMail({
    from,
    to,
    subject: `Turniejomat — klucz licencyjny ${licenseKey}`,
    text: `Dziękujemy za zakup ${productLabel}.\n\nTwój klucz: ${licenseKey}\nWażny do: ${expiresAt ? new Date(expiresAt).toLocaleString('pl-PL') : '—'}\n\nWejdź: https://app.turniejomat.pl\n\nPozdrawiamy,\nTurniejomat`,
    html: buildLicenseEmailHtml({ licenseKey, productLabel, expiresAt }),
  });

  return { sent: true };
}

module.exports = { sendLicenseEmail };
