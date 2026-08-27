const nodemailer = require('nodemailer');
const { getEmailConfig } = require('../params');

const APP_URL = 'https://app.turniejomat.pl';
const DEFAULT_SUPPORT_EMAIL = 'admin@turniejomat.pl';

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

function appConfigFromInput(appInput) {
  const app = appInput || {};
  return {
    name: app.name || 'Turniejomat',
    appUrl: app.appUrl || APP_URL,
    supportEmail: app.supportEmail || DEFAULT_SUPPORT_EMAIL,
    ctaLabel: app.ctaLabel || 'Wejdź do turnieju',
  };
}

/** UX TOP 10 #8 — tylko Turniejomat (nie SETKA). */
function isTurniejomatOnboarding(app) {
  return appConfigFromInput(app).name !== 'SETKA';
}

function buildTurniejomatOnboardingBlock(licenseKey, app) {
  const cfg = appConfigFromInput(app);
  const appLink = `${cfg.appUrl}/?id=${encodeURIComponent(licenseKey)}`;
  return [
    'Masz klucz licencyjny Turniejomat. Demo pokazuje finał i emocje — teraz ustawiasz swój turniej. Cel: ok. 15 minut do pierwszego wyniku.',
    '',
    `1. Wejdź na ${appLink} i wklej klucz.`,
    '2. Na Start ustaw turniej (np. 8 drużyn) — kolejność: „Zrób to w tej kolejności” w Archiwum → Pomoc.',
    '3. Utwórz drużyny → Tor → 1 · Grupy → Tor → 2 · Terminarz.',
    '4. Udostępnij QR / link kibica.',
    '5. W Na żywo wpisz 1 testowy wynik (potem możesz poprawić).',
    '6. Opcja: link asystenta na telefon przy boisku.',
    '',
    'Nie zaczynaj od seed, kartek ani kapitana — to zaawansowane.',
    'RESET tylko gdy nie ma żadnego rozegranego meczu.',
    'CHECKLISTA START i Pomoc: w aplikacji → Archiwum.',
  ].join('\n');
}

function buildLicenseEmailHtml({ licenseKey, productLabel, expiresAt, validityText, app }) {
  const cfg = appConfigFromInput(app);
  const expiryStr = validityText
    ? validityText
    : (expiresAt ? new Date(expiresAt).toLocaleString('pl-PL') : '—');
  const expiryLabel = validityText ? 'Okres licencji' : 'Licencja ważna do';
  const appLink = `${cfg.appUrl}/?id=${encodeURIComponent(licenseKey)}`;
  const isSetka = cfg.name === 'SETKA';
  const footer = isSetka
    ? 'SETKA © 2026 · powered by Turniejomat'
    : 'Turniejomat © 2026 · powered by TurniejPro';
  const withOnboarding = isTurniejomatOnboarding(app);
  const title = withOnboarding
    ? 'Turniejomat — Pierwsze 15 minut z kluczem'
    : `${cfg.name} — Twój klucz licencyjny`;
  const onboardingHtml = withOnboarding
    ? `<p style="font-size: 14px; white-space: pre-line;">${buildTurniejomatOnboardingBlock(licenseKey, app).replace(/\n/g, '<br>')}</p>`
    : '';
  const closingHtml = withOnboarding
    ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Powodzenia,<br>Turniejomat<br>${footer}</p>`
    : `<p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">${footer}</p>`;

  return `
<!DOCTYPE html>
<html lang="pl">
<body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 560px;">
  <h2 style="color: #0052cc;">${title}</h2>
  ${withOnboarding ? '<p>Cześć,</p>' : ''}
  <p>Dziękujemy za zakup <strong>${productLabel}</strong>.</p>
  <p style="font-size: 16px;">Twój klucz licencyjny:</p>
  <p style="font-size: 22px; font-weight: bold; font-family: ui-monospace, monospace; background: #f1f5f9; padding: 14px 18px; border-radius: 8px; letter-spacing: 0.04em;">${licenseKey}</p>
  <p>${expiryLabel}: <strong>${expiryStr}</strong></p>
  <p style="margin: 24px 0;">
    <a href="${appLink}" style="display:inline-block;background:#137333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
      ${cfg.ctaLabel}
    </a>
  </p>
  ${onboardingHtml}
  <p style="font-size: 13px; color: #64748b;">
    Możesz też wpisać klucz ręcznie na <a href="${cfg.appUrl}">${cfg.appUrl}</a><br>
    Pytania: <a href="mailto:${cfg.supportEmail}">${cfg.supportEmail}</a>
  </p>
  ${closingHtml}
</body>
</html>`;
}

function buildLicenseEmailText({ licenseKey, productLabel, expiresAt, validityText, app }) {
  const cfg = appConfigFromInput(app);
  const expiryStr = validityText
    ? validityText
    : (expiresAt ? new Date(expiresAt).toLocaleString('pl-PL') : '—');
  const expiryLabel = validityText ? 'Okres licencji' : 'Ważny do';
  const appLink = `${cfg.appUrl}/?id=${encodeURIComponent(licenseKey)}`;
  const withOnboarding = isTurniejomatOnboarding(app);

  const lines = withOnboarding
    ? [
      'Turniejomat — Pierwsze 15 minut z kluczem',
      '',
      'Cześć,',
      '',
      `Dziękujemy za zakup ${productLabel}.`,
      '',
      `Klucz: ${licenseKey}`,
      `${expiryLabel}: ${expiryStr}`,
      '',
      `Wejdź do aplikacji: ${appLink}`,
      '',
      buildTurniejomatOnboardingBlock(licenseKey, app),
      '',
      'Powodzenia,',
      'Turniejomat',
      '',
      `Pytania: ${cfg.supportEmail}`,
    ]
    : [
      `${cfg.name} — Twój klucz licencyjny`,
      '',
      `Dziękujemy za zakup ${productLabel}.`,
      '',
      `Klucz: ${licenseKey}`,
      `${expiryLabel}: ${expiryStr}`,
      '',
      `Wejdź do aplikacji: ${appLink}`,
      '',
      `Pytania: ${cfg.supportEmail}`,
    ];

  return lines.join('\n');
}

async function sendLicenseEmail({ to, licenseKey, productLabel, expiresAt, validityText, app }) {
  if (!to) {
    return { sent: false, reason: 'no_recipient' };
  }

  const cfg = getEmailConfig();
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email skipped — brak konfiguracji SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    return { sent: false, reason: 'not_configured' };
  }

  const from = cfg.from || 'Turniejomat <noreply@turniejomat.pl>';
  const payload = { licenseKey, productLabel, expiresAt, validityText, app };
  const appCfg = appConfigFromInput(app);
  const withOnboarding = isTurniejomatOnboarding(app);

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: cfg.reply_to || appCfg.supportEmail,
      subject: withOnboarding
        ? 'Turniejomat — Pierwsze 15 minut z kluczem'
        : `${appCfg.name} — Twój klucz licencyjny`,
      text: buildLicenseEmailText(payload),
      html: buildLicenseEmailHtml(payload),
    });
    console.log('License email sent to', to);
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
