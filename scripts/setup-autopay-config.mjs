#!/usr/bin/env node
/**
 * Konfiguracja Autopay: secret AUTOPAY_SHARED_KEY + parametry w .env.turniejprosaas
 *
 * Użycie (PowerShell):
 *   $env:AUTOPAY_SERVICE_ID="123456"
 *   $env:AUTOPAY_SHARED_KEY="..."
 *   $env:AUTOPAY_GATEWAY_URL="https://testpay.autopay.eu"   # opcjonalnie, test
 *   node scripts/setup-autopay-config.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const ENV_FILE = join(ROOT, 'functions', '.env.turniejprosaas');

const serviceId = process.env.AUTOPAY_SERVICE_ID || '';
const sharedKey = process.env.AUTOPAY_SHARED_KEY || '';
const gatewayUrl = process.env.AUTOPAY_GATEWAY_URL || 'https://pay.autopay.eu/payment';

if (!serviceId || !sharedKey) {
  console.error('Ustaw AUTOPAY_SERVICE_ID i AUTOPAY_SHARED_KEY w środowisku.');
  process.exit(1);
}

function setSecret(name, value) {
  const tmp = join(tmpdir(), `autopay-${name}.tmp`);
  writeFileSync(tmp, value, 'utf8');
  console.log(`secret ${name}`);
  const r = spawnSync('firebase', ['functions:secrets:set', name, '--data-file', tmp], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  try { unlinkSync(tmp); } catch { /* ignore */ }
  if (r.status !== 0) process.exit(r.status || 1);
}

setSecret('AUTOPAY_SHARED_KEY', sharedKey);

const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split(/\r?\n/) : [];
const updates = {
  PAYMENT_PROVIDER: 'autopay',
  AUTOPAY_SERVICE_ID: serviceId,
  AUTOPAY_GATEWAY_URL: gatewayUrl,
};
const keys = new Set(Object.keys(updates));
const out = [];
for (const line of lines) {
  const m = line.match(/^([A-Z_]+)=/);
  if (m && keys.has(m[1])) {
    out.push(`${m[1]}=${updates[m[1]]}`);
    keys.delete(m[1]);
  } else if (line.trim() !== '' || out.length) {
    out.push(line);
  }
}
for (const k of keys) {
  out.push(`${k}=${updates[k]}`);
}
writeFileSync(ENV_FILE, out.join('\n').replace(/\n+$/, '\n'), 'utf8');

console.log(`\nZapisano ${ENV_FILE}`);
console.log('\nITN URL (panel Autopay):');
console.log('https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=autopay');
console.log('\nNastępny krok: cd functions && npm install && firebase deploy --only functions');
