#!/usr/bin/env node
/**
 * Ustawia parametry SMTP (Secret Manager + .env.turniejprosaas).
 * Użycie (PowerShell):
 *   $env:SMTP_HOST="mx.hosti24.pl"
 *   $env:SMTP_USER="admin@turniejomat.pl"
 *   $env:SMTP_PASS="..."
 *   node scripts/setup-email-config.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const ENV_FILE = join(ROOT, 'functions', '.env.turniejprosaas');

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Brak zmiennych:', missing.join(', '));
  console.error('Zobacz docs/EMAIL.md');
  process.exit(1);
}

function setSecret(name, value) {
  const tmp = join(tmpdir(), `turniejomat-${name}.tmp`);
  writeFileSync(tmp, value, 'utf8');
  const r = spawnSync('firebase', ['functions:secrets:set', name, '--data-file', tmp], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  try { unlinkSync(tmp); } catch { /* ignore */ }
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log('Ustawiam SMTP_PASS w Secret Manager…');
setSecret('SMTP_PASS', process.env.SMTP_PASS);

const envMap = {};
if (existsSync(ENV_FILE)) {
  readFileSync(ENV_FILE, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) envMap[m[1]] = m[2];
  });
}

Object.assign(envMap, {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_SECURE: process.env.SMTP_SECURE || 'false',
  EMAIL_FROM: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Turniejomat <noreply@turniejomat.pl>',
  EMAIL_REPLY_TO: process.env.SMTP_REPLY_TO || process.env.EMAIL_REPLY_TO || 'admin@turniejomat.pl',
});

const lines = [
  '# Turniejomat — parametry Functions (generowane przez setup-email-config.mjs)',
  '',
  `APP_URL=${envMap.APP_URL || 'https://app.turniejomat.pl'}`,
  `APP_LANDING_URL=${envMap.APP_LANDING_URL || 'https://turniejomat.pl'}`,
  `STRIPE_PAYMENT_METHOD_TYPES=${envMap.STRIPE_PAYMENT_METHOD_TYPES || 'card,blik'}`,
  `SMTP_HOST=${envMap.SMTP_HOST}`,
  `SMTP_PORT=${envMap.SMTP_PORT}`,
  `SMTP_USER=${envMap.SMTP_USER}`,
  `SMTP_SECURE=${envMap.SMTP_SECURE}`,
  `EMAIL_FROM=${envMap.EMAIL_FROM}`,
  `EMAIL_REPLY_TO=${envMap.EMAIL_REPLY_TO}`,
  '',
];

writeFileSync(ENV_FILE, lines.join('\n'), 'utf8');
console.log(`\n✅ Zapisano ${ENV_FILE}`);
console.log('Teraz: cd functions && npm install && firebase deploy --only functions');
