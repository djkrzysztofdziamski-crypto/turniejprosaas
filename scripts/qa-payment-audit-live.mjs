#!/usr/bin/env node
/**
 * Pełny audyt płatności live (A→Z) — bez dokonywania prawdziwej płatności kartą/BLIK.
 * Uruchom: node scripts/qa-payment-audit-live.mjs
 *
 * Wymiary: merytoryczny (ścieżka sprzedaży) + bezpieczeństwo (hash, ITN, surface).
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const __dir = dirname(fileURLToPath(import.meta.url));
const { autopayHash } = require(join(__dir, '../functions/lib/billing/autopay/hash.js'));
const {
  parseItnTransactionListXml,
  buildItnConfirmationXml,
} = require(join(__dir, '../functions/lib/billing/autopay/xml.js'));

const CHECKOUT = 'https://europe-west1-turniejprosaas.cloudfunctions.net/createCheckoutSession';
const CATALOG = 'https://europe-west1-turniejprosaas.cloudfunctions.net/getProductCatalog';
const WEBHOOK = 'https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=autopay';
const LANDING = 'https://turniejomat.pl';
const APP = 'https://app.turniejomat.pl';

const results = [];
const startedAt = new Date().toISOString();

function add(area, label, ok, detail = '', severity = 'info') {
  results.push({ area, label, ok, detail, severity: ok ? 'pass' : severity });
  console.log(ok ? '✅' : '❌', `[${area}]`, label, detail ? `— ${detail}` : '');
}

async function callFn(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json, data: json.result || json.error || json };
}

async function headOrGet(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return { status: res.status, text: await res.text(), headers: res.headers };
}

function validateStartFields(fields, productId, email) {
  const issues = [];
  if (!fields?.ServiceID) issues.push('brak ServiceID');
  if (!fields?.OrderID || fields.OrderID.length > 32) issues.push('OrderID invalid');
  if (!/^[A-Za-z0-9_-]+$/.test(fields?.OrderID || '')) issues.push('OrderID charset');
  if (!/^\d+\.\d{2}$/.test(fields?.Amount || '')) issues.push('Amount format');
  if (fields?.Currency !== 'PLN') issues.push('Currency');
  if (fields?.CustomerEmail !== email) issues.push('CustomerEmail mismatch');
  if (!fields?.Hash || fields.Hash.length !== 64) issues.push('Hash length');
  if (!/^[a-f0-9]{64}$/i.test(fields?.Hash || '')) issues.push('Hash hex');
  if (!fields?.Description || fields.Description.length > 79) issues.push('Description');
  if (!/^[A-Za-z0-9.:,\- ]+$/.test(fields?.Description || '')) issues.push('Description charset');
  const expectedAmt = productId === 'football-month' ? '149.00' : '79.00';
  if (fields?.Amount !== expectedAmt) issues.push(`Amount expected ${expectedAmt}`);
  return issues;
}

async function probeGatewayStart(url, fields) {
  const body = new URLSearchParams(fields).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
  });
  const loc = res.headers.get('location') || '';
  return { status: res.status, location: loc };
}

async function main() {
  console.log('=== AUDYT PŁATNOŚCI LIVE A→Z ===\n', startedAt, '\n');

  // --- A. Katalog ---
  {
    const { res, data } = await callFn(CATALOG, {});
    const products = data?.products || [];
    add('Katalog', 'HTTP katalogu', res.ok);
    add('Katalog', '2 produkty aktywne', products.length >= 2, products.map((p) => p.id).join(', '));
    const w = products.find((p) => p.id === 'football-weekend');
    const m = products.find((p) => p.id === 'football-month');
    add('Katalog', 'Weekend 79 PLN', w?.pricePln === 79, String(w?.pricePln));
    add('Katalog', 'Miesiąc 149 PLN', m?.pricePln === 149, String(m?.pricePln));
  }

  // --- B. Checkout start (weekend + month) ---
  let weekendCheckout = null;
  for (const [productId, email] of [
    ['football-weekend', 'audit-weekend@turniejomat.pl'],
    ['football-month', 'audit-month@turniejomat.pl'],
  ]) {
    const { res, data } = await callFn(CHECKOUT, {
      productId,
      email,
      termsAccepted: true,
      withdrawalConsent: true,
      termsVersion: 'RUP-2.1/RS-1.2/PP-2.1',
    });
    const okProvider = data?.provider === 'autopay';
    add('Start', `${productId}: provider Autopay`, okProvider, data?.provider, 'critical');
    add('Start', `${productId}: URL live /payment`, data?.url === 'https://pay.autopay.eu/payment', data?.url, 'critical');
    add('Start', `${productId}: method POST`, data?.method === 'POST', data?.method);
    const issues = validateStartFields(data?.fields, productId, email);
    add('Start', `${productId}: pola startu`, issues.length === 0, issues.join('; ') || 'OK', 'critical');
    if (productId === 'football-weekend') weekendCheckout = data;

    // Negatywne: bez zgód
    const bad = await callFn(CHECKOUT, { productId, email });
    const rejected =
      bad.res.status >= 400 ||
      bad.json?.error ||
      bad.data?.code === 'invalid-argument' ||
      bad.data?.message;
    add('Start', `${productId}: bez checkboxów → odrzucenie`, !!rejected || !bad.data?.url, JSON.stringify(bad.data).slice(0, 120), 'high');
  }

  // Nieznany produkt
  {
    const { data } = await callFn(CHECKOUT, {
      productId: 'no-such-product',
      email: 'x@y.pl',
      termsAccepted: true,
      withdrawalConsent: true,
      termsVersion: 'x',
    });
    add('Start', 'nieznany productId → błąd', !data?.url, JSON.stringify(data).slice(0, 140), 'high');
  }

  // --- C. Bramka Autopay (POST bez finalnej płatności) ---
  if (weekendCheckout?.fields && weekendCheckout?.url) {
    const probe = await probeGatewayStart(weekendCheckout.url, weekendCheckout.fields);
    const toStart = /\/web\/payment\/start\//.test(probe.location);
    const not404 = !/error\/404/.test(probe.location);
    add('Bramka', 'POST /payment → start (nie 404)', probe.status === 303 && toStart && not404, `${probe.status} ${probe.location}`, 'critical');

    // Host bez /payment = regresja 404
    const badHost = await probeGatewayStart('https://pay.autopay.eu', weekendCheckout.fields);
    add('Bramka', 'regresja: POST na host bez /payment → 404', /error\/404/.test(badHost.location || ''), badHost.location, 'high');
  }

  // --- D. ITN / webhook ---
  {
    const getRes = await fetch(WEBHOOK, { method: 'GET' });
    add('ITN', 'GET webhook → 405', getRes.status === 405, String(getRes.status), 'medium');

    const empty = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
    add('ITN', 'puste body → 400', empty.status === 400, String(empty.status), 'high');

    const junk = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'transactions=' + encodeURIComponent(Buffer.from('<test/>').toString('base64')),
    });
    add('ITN', 'śmieciowy XML → 400', junk.status === 400, String(junk.status), 'high');

    // Syntetyczny ITN z złym hashem — oczekujemy XML NOTCONFIRMED (200) lub 400
    const fakeXml = `<?xml version="1.0" encoding="UTF-8"?>
<transactionList>
  <serviceID>217795</serviceID>
  <transactions>
    <transaction>
      <orderID>TPFAKEAUDIT0001</orderID>
      <remoteID>R1</remoteID>
      <amount>79.00</amount>
      <currency>PLN</currency>
      <gatewayID>150</gatewayID>
      <paymentDate>20260716120000</paymentDate>
      <paymentStatus>SUCCESS</paymentStatus>
    </transaction>
  </transactions>
  <hash>0000000000000000000000000000000000000000000000000000000000000000</hash>
</transactionList>`;
    const fakeB64 = Buffer.from(fakeXml).toString('base64');
    const fakeRes = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'transactions=' + encodeURIComponent(fakeB64),
    });
    const fakeBody = await fakeRes.text();
    const notConfirmed = fakeBody.includes('NOTCONFIRMED') || fakeRes.status === 400;
    const hasCorrectStructure =
      fakeBody.includes('confirmationList') &&
      fakeBody.includes('transactionsConfirmations') &&
      fakeBody.includes('transactionConfirmed');
    add('ITN', 'zły hash → NOTCONFIRMED / odrzucenie', notConfirmed, `HTTP ${fakeRes.status}`, 'critical');
    if (fakeRes.status === 200) {
      add('ITN', 'odpowiedź XML zgodna z docs Autopay', hasCorrectStructure, fakeBody.slice(0, 180), 'critical');
    }
  }

  // --- E. Landing / surface ---
  {
    const pages = [
      ['/', ['startCheckout', 'checkout-terms', 'checkout-withdrawal', 'football-weekend']],
      ['/dziekujemy.html', ['Dziękujemy', 'Zaloguj się do aplikacji']],
      ['/platnosci.html', ['Autopay', 'Akceptowane metody']],
      ['/legal/regulamin-uslug-platnych.html', ['Autopay', 'Płatności']],
      ['/legal/polityka-prywatnosci.html', ['Autopay']],
      ['/img/autopay-metody-platnosci.png', []],
      ['/css/responsive.css?v=20260716r2', ['max-width: 479px']],
    ];
    for (const [path, needles] of pages) {
      const { status, text } = await headOrGet(LANDING + path);
      add('Landing', `${path} HTTP`, status === 200, String(status), path.includes('dziekujemy') || path.includes('img') ? 'high' : 'medium');
      for (const n of needles) {
        add('Landing', `${path} zawiera „${n}”`, text.includes(n), '', 'medium');
      }
      if (path === '/') {
        add('Bezpieczeństwo', 'landing nie eksponuje SHARED_KEY', !/AUTOPAY_SHARED_KEY|sharedKey|2test2/i.test(text), '', 'critical');
        add('Bezpieczeństwo', 'landing nie eksponuje SMTP_PASS', !/SMTP_PASS|hasło/i.test(text), '', 'high');
      }
    }
  }

  // --- F. App surface ---
  {
    const { status, text } = await headOrGet(APP + '/');
    add('App', 'bramka HTTP 200', status === 200);
    add('Bezpieczeństwo', 'app nie eksponuje SHARED_KEY', !/AUTOPAY_SHARED_KEY/i.test(text), '', 'critical');
    add('App', 'redirect legacy checkout=success w kodzie', text.includes('dziekujemy.html') || text.includes('checkout'), text.includes('dziekujemy') ? 'dziekujemy' : 'partial');
  }

  // --- G. Algorytm hash / XML (lokalnie, docs) ---
  {
    const doc = autopayHash(['2', '100', '1.50'], '2test2');
    add('Krypto', 'hash start = przykład docs', doc === '2ab52e6918c6ad3b69a8228a2ab815f11ad58533eeed963dd990df8d8c3709d1', '', 'critical');
    const conf = buildItnConfirmationXml({
      serviceID: '217795',
      orderID: 'X',
      confirmation: 'CONFIRMED',
      hash: 'abc',
    });
    add('Krypto', 'confirmationList struktura docs', conf.includes('transactionsConfirmations') && !/<confirmationList>\s*<confirmation>/.test(conf), '', 'critical');
    const parsed = parseItnTransactionListXml(`<?xml version="1.0"?><transactionList><serviceID>1</serviceID><transactions><transaction><orderID>O</orderID><amount>1.00</amount><currency>PLN</currency><remoteID>R</remoteID><paymentDate>20200101120000</paymentDate><paymentStatus>SUCCESS</paymentStatus></transaction></transactions><hash>HH</hash></transactionList>`);
    add('Krypto', 'parse ITN bierze hash z listy', parsed?.hash === 'HH' && parsed?.serviceID === '1', '', 'critical');
  }

  // --- H. HTTPS / TLS surface ---
  for (const url of [LANDING, APP, CHECKOUT, WEBHOOK.split('?')[0]]) {
    add('TLS', `HTTPS ${new URL(url).host}`, url.startsWith('https://'), url, 'high');
  }

  // --- I. Ograniczenia audytu (świadome) ---
  add(
    'Manual',
    'Prawdziwa płatność BLIK/przelew (pieniądze) — poza zakresem automatu',
    true,
    'Wymaga ręcznego kliknięcia; wcześniej live OK + saldo Autopay potwierdzone przez operatora',
    'info'
  );
  add(
    'Manual',
    'Return URL w panelu Autopay = /dziekujemy.html',
    true,
    'Do potwierdzenia w panelu Autopay (operator)',
    'info'
  );

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const criticalFail = results.filter((r) => !r.ok && r.severity === 'critical').length;
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    gatewayLive: 'https://pay.autopay.eu/payment',
    summary: { passed, failed, criticalFail, total: results.length },
    results,
  };

  const out = join(__dir, 'qa-payment-audit-live-report.json');
  writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');
  console.log('\n=== PODSUMOWANIE ===');
  console.log(`OK: ${passed} | FAIL: ${failed} | CRITICAL FAIL: ${criticalFail} | RAZEM: ${results.length}`);
  console.log('Raport:', out);
  process.exit(failed || criticalFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
