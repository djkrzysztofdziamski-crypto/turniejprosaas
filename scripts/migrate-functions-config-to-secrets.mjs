#!/usr/bin/env node
/**
 * Migruje firebase functions:config → params (Secret Manager + .env.turniejprosaas)
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const ENV_FILE = join(ROOT, 'functions', '.env.turniejprosaas');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: true, ...opts });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || `Command failed: ${cmd}`);
    process.exit(r.status || 1);
  }
  return (r.stdout || '').trim();
}

function setSecret(name, value) {
  if (!value) {
    console.log(`  skip ${name} (brak wartości)`);
    return;
  }
  const tmp = join(tmpdir(), `migrate-${name}.tmp`);
  writeFileSync(tmp, value, 'utf8');
  console.log(`  secret ${name}`);
  const r = spawnSync('firebase', ['functions:secrets:set', name, '--data-file', tmp], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  try { unlinkSync(tmp); } catch { /* ignore */ }
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log('Odczyt legacy functions:config…');
const raw = run('firebase', ['functions:config:get']);
const cfg = JSON.parse(raw);

const stripe = cfg.stripe || {};
const email = cfg.email || {};
const app = cfg.app || {};

console.log('\nZapis secretów (Secret Manager)…');
setSecret('STRIPE_SECRET_KEY', stripe.secret_key);
setSecret('STRIPE_WEBHOOK_SECRET', stripe.webhook_secret);
setSecret('SMTP_PASS', email.smtp_pass);

const envLines = [
  '# Wygenerowano przez migrate-functions-config-to-secrets.mjs — nie commituj',
  '',
  `APP_URL=${app.url || 'https://app.turniejomat.pl'}`,
  `APP_LANDING_URL=${app.landing_url || 'https://turniejomat.pl'}`,
  `STRIPE_PAYMENT_METHOD_TYPES=${stripe.payment_method_types || 'card,blik'}`,
  `SMTP_HOST=${email.smtp_host || ''}`,
  `SMTP_PORT=${email.smtp_port || '587'}`,
  `SMTP_USER=${email.smtp_user || ''}`,
  `SMTP_SECURE=${email.smtp_secure || 'false'}`,
  `EMAIL_FROM=${email.from || 'Turniejomat <noreply@turniejomat.pl>'}`,
  `EMAIL_REPLY_TO=${email.reply_to || 'admin@turniejomat.pl'}`,
  '',
];

writeFileSync(ENV_FILE, envLines.join('\n'), 'utf8');
console.log(`\nZapisano ${ENV_FILE}`);
console.log('\nNastępny krok: cd functions && npm install && firebase deploy --only functions');
