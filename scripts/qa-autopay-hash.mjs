#!/usr/bin/env node
/**
 * Weryfikuje algorytm hash Autopay (SHA256, pola oddzielone |, na końcu klucz).
 * Przykład z dokumentacji: ServiceID=2, OrderID=100, Amount=1.50, key=2test2
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dir = dirname(fileURLToPath(import.meta.url));
const { autopayHash } = require(join(__dir, '../functions/lib/billing/autopay/hash.js'));

const DOC_HASH = '2ab52e6918c6ad3b69a8228a2ab815f11ad58533eeed963dd990df8d8c3709d1';
const calc = autopayHash(['2', '100', '1.50'], '2test2');

console.log('=== QA Autopay hash ===\n');
console.log('expected:', DOC_HASH);
console.log('calculated:', calc);
console.log(calc === DOC_HASH ? '✅ hash OK' : '❌ hash mismatch');
process.exit(calc === DOC_HASH ? 0 : 1);
