#!/usr/bin/env node
import { createRequire } from 'module';
import { generateKeyPairSync } from 'crypto';

const require = createRequire(import.meta.url);
const { getProduct } = require('../functions/lib/billing/catalog');
const { createAndActivateSetkaLicense } = require('../functions/lib/licensing/setkaIssue');

class MemDb {
  constructor() {
    this.data = {};
  }
  ref(path) {
    const db = this;
    const key = String(path || '');
    return {
      async once() {
        return {
          val() {
            return db.data[key] || null;
          },
        };
      },
      async set(value) {
        db.data[key] = value;
      },
      async update(patch) {
        db.data[key] = { ...(db.data[key] || {}), ...(patch || {}) };
      },
    };
  }
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

function mkPem() {
  const { privateKey } = generateKeyPairSync('ed25519');
  return privateKey.export({ type: 'pkcs8', format: 'pem' });
}

async function run() {
  const pWeekend = getProduct('setka-weekend');
  const pMonth = getProduct('setka-month');
  const pYear = getProduct('setka-year');
  assert(pWeekend && pWeekend.app === 'setka', 'Brak produktu setka-weekend');
  assert(pMonth && pMonth.days === 30, 'Brak produktu setka-month');
  assert(pYear && pYear.days === 365, 'Brak produktu setka-year');

  const db = new MemDb();
  const keyPem = mkPem();
  const first = await createAndActivateSetkaLicense(db, {
    productId: 'setka-weekend',
    source: 'autopay',
    paymentId: 'TPSETKA_TEST_001',
    customerEmail: 'qa@example.com',
    privateKeyPem: keyPem,
    notatka: 'QA',
  });
  assert(first.ok === true, 'Issuance SETKA nie powiodło się');
  assert(/^SETKA1\./.test(first.key), 'Token SETKA ma zły prefiks');
  assert(first.until, 'Brak daty until');

  const second = await createAndActivateSetkaLicense(db, {
    productId: 'setka-weekend',
    source: 'autopay',
    paymentId: 'TPSETKA_TEST_001',
    customerEmail: 'qa@example.com',
    privateKeyPem: keyPem,
  });
  assert(second.alreadyProcessed === true, 'Brak idempotencji po paymentId');
  assert(first.key === second.key, 'Idempotencja zwróciła inny token');

  const order = db.data['zamowienia/TPSETKA_TEST_001'];
  assert(order && order.app === 'setka', 'Zamówienie nie ma app=setka');
  const lic = db.data['licencje_setka/TPSETKA_TEST_001'];
  assert(lic && lic.token === first.key, 'Brak zapisu tokenu w licencje_setka');

  console.log('OK qa-setka-billing');
}

run().catch((err) => {
  console.error('FAIL qa-setka-billing:', err.message);
  process.exit(1);
});
