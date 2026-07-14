#!/usr/bin/env node
/**
 * Ustawia email.smtp_* w Firebase Functions config.
 * Użycie (PowerShell):
 *   $env:SMTP_HOST="smtp-relay.brevo.com"
 *   $env:SMTP_USER="..."
 *   $env:SMTP_PASS="..."
 *   node scripts/setup-email-config.mjs
 */
import { spawnSync } from 'node:child_process';

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Brak zmiennych:', missing.join(', '));
  console.error('Zobacz docs/EMAIL.md');
  process.exit(1);
}

const args = [
  'functions:config:set',
  `email.smtp_host="${process.env.SMTP_HOST}"`,
  `email.smtp_port="${process.env.SMTP_PORT || '587'}"`,
  `email.smtp_user="${process.env.SMTP_USER}"`,
  `email.smtp_pass="${process.env.SMTP_PASS}"`,
  `email.smtp_secure="${process.env.SMTP_SECURE || 'false'}"`,
  `email.from="${process.env.SMTP_FROM || 'Turniejomat <noreply@turniejomat.pl>'}"`,
  `email.reply_to="${process.env.SMTP_REPLY_TO || 'admin@turniejomat.pl'}"`,
];

console.log('Ustawiam Firebase functions config (email.*)...');
const result = spawnSync('firebase', args, { stdio: 'inherit', shell: true });
if (result.status !== 0) process.exit(result.status || 1);

console.log('\n✅ Config zapisany. Teraz:');
console.log('  cd functions && npm install');
console.log('  firebase deploy --only functions');
console.log('  Admin → TEST SMTP');
