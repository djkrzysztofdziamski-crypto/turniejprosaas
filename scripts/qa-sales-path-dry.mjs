#!/usr/bin/env node
/**
 * Suchy smoke test całej ścieżki sprzedaży (bez płatności Autopay).
 * Uruchom: node scripts/qa-sales-path-dry.mjs
 */
const APP_URL = process.env.APP_URL || 'https://app.turniejomat.pl/';
const DEMO_URL = process.env.DEMO_URL || 'https://demo.turniejomat.pl/';
const LANDING_URL = process.env.LANDING_URL || 'https://turniejomat.pl/';
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.turniejomat.pl/';
const CHECKOUT_FN = 'https://europe-west1-turniejprosaas.cloudfunctions.net/createCheckoutSession';
const CATALOG_FN = 'https://europe-west1-turniejprosaas.cloudfunctions.net/getProductCatalog';
const WEBHOOK_FN = 'https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=autopay';

const results = [];

function pass(label, detail = '') {
  results.push({ ok: true, label, detail });
  console.log('✅', label, detail ? `— ${detail}` : '');
}

function fail(label, detail = '') {
  results.push({ ok: false, label, detail });
  console.log('❌', label, detail ? `— ${detail}` : '');
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return { res, text: await res.text() };
}

async function callFn(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function main() {
  console.log('=== QA: suchy smoke test ścieżki sprzedaży ===\n');
  console.log(new Date().toISOString(), '\n');

  // --- FRONT: app / demo / admin ---
  for (const [name, url, needles] of [
    ['App (bramka)', APP_URL, ['Turniejomat', 'btn-submit', 'demo']],
    ['Demo Story', DEMO_URL, ['demo-story', 'Zobacz finał', 'demo-story.js']],
    ['Admin', ADMIN_URL, ['Turniejomat', 'admin']],
  ]) {
    try {
      const { res, text } = await fetchText(url);
      if (!res.ok) fail(`${name} HTTP`, String(res.status));
      else pass(`${name} HTTP 200`);
      for (const n of needles) {
        (text.includes(n) ? pass : fail)(`${name}: zawiera „${n}”`);
      }
    } catch (e) {
      fail(`${name} fetch`, e.message);
    }
  }

  // Demo JS — ostatni deploy
  try {
    const { res, text } = await fetchText(DEMO_URL.replace(/\/?$/, '/') + 'demo-story.js');
    if (res.ok && text.includes('renderDemoHallEmbed')) pass('Demo JS: renderDemoHallEmbed (737ce45+)');
    else fail('Demo JS: brak renderDemoHallEmbed');
    if (text.includes('ctaLanding')) pass('Demo JS: CTA landing 6/6');
    else fail('Demo JS: brak CTA landing');
  } catch (e) {
    fail('Demo JS fetch', e.message);
  }

  // --- LANDING checkout UI ---
  try {
    const { res, text } = await fetchText(LANDING_URL);
    if (res.ok) pass('Landing HTTP 200');
    else fail('Landing HTTP', String(res.status));
    const landingChecks = [
      'startCheckout',
      'submitPaymentForm',
      'checkout-email',
      'checkout-terms',
      'checkout-withdrawal',
      'football-weekend',
      'football-month',
      'legal/regulamin-serwisu.html',
    ];
    for (const c of landingChecks) {
      (text.includes(c) ? pass : fail)(`Landing: ${c}`);
    }
  } catch (e) {
    fail('Landing fetch', e.message);
  }

  // --- FUNCTIONS: katalog ---
  try {
    const { res, json } = await callFn(CATALOG_FN, {});
    const products = json?.result?.products || [];
    if (res.ok && products.length >= 2) {
      pass('getProductCatalog', `${products.length} produktów`);
      const ids = products.map((p) => p.id).join(', ');
      pass('Katalog productId', ids);
    } else {
      fail('getProductCatalog', JSON.stringify(json).slice(0, 200));
    }
  } catch (e) {
    fail('getProductCatalog', e.message);
  }

  // --- FUNCTIONS: checkout Autopay (bez płatności) ---
  try {
    const { res, json } = await callFn(CHECKOUT_FN, {
      productId: 'football-weekend',
      email: 'qa-dry@turniejomat.pl',
      termsAccepted: true,
      withdrawalConsent: true,
      termsVersion: 'RUP-2.1/RS-1.2/PP-2.1',
    });
    const data = json?.result || {};
    if (data.provider === 'autopay' && data.url && data.fields?.Hash) {
      pass('createCheckoutSession → Autopay POST', data.url);
      pass('Autopay orderId', data.orderId || data.fields?.OrderID || '—');
      if (data.fields.ServiceID) pass('Autopay ServiceID', String(data.fields.ServiceID));
      else fail('Autopay ServiceID brak');
    } else if (data.url?.includes('checkout.stripe.com')) {
      fail('createCheckoutSession', 'Stripe zamiast Autopay (sprawdź PAYMENT_PROVIDER)');
    } else {
      fail('createCheckoutSession', JSON.stringify(json).slice(0, 300));
    }
  } catch (e) {
    fail('createCheckoutSession', e.message);
  }

  // --- WEBHOOK ITN: suchy test (invalid hash → odrzucenie, nie fulfillment) ---
  try {
    const res = await fetch(WEBHOOK_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'transactions=' + encodeURIComponent(Buffer.from('<test/>').toString('base64')),
    });
    const body = await res.text();
    if (res.status >= 400 && res.status < 500) {
      pass('paymentWebhook ITN (invalid payload)', `HTTP ${res.status}`);
    } else if (body.includes('REJECTED') || body.includes('ERROR') || body.includes('Invalid')) {
      pass('paymentWebhook ITN odrzuca śmieci', body.slice(0, 80));
    } else {
      fail('paymentWebhook ITN', `HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
  } catch (e) {
    fail('paymentWebhook', e.message);
  }

  // --- Demo → app link ---
  try {
    const { text } = await fetchText(DEMO_URL.replace(/\/?$/, '/') + 'demo-story.js');
    if (text.includes('app.turniejomat.pl')) pass('Demo CTA → app.turniejomat.pl');
    else fail('Demo CTA app URL');
    if (text.includes('turniejomat.pl')) pass('Demo CTA → turniejomat.pl (landing)');
    else fail('Demo CTA landing URL');
  } catch (e) {
    fail('Demo CTA links', e.message);
  }

  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  console.log('\n=== PODSUMOWANIE ===');
  console.log(`OK: ${ok}  |  FAIL: ${bad}  |  RAZEM: ${results.length}`);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'dry-run (bez płatności Autopay)',
    summary: { ok, fail: bad, total: results.length },
    results,
    pendingManual: [
      'Weryfikacja konta Autopay (ITN URL w panelu)',
      'Test płatności testowej na testpay.autopay.eu po akceptacji Autopay',
      'firebase deploy --only functions (jeśli AUTOPAY_SHARED_KEY w Secret Manager)',
    ],
  };
  const fs = await import('node:fs');
  const path = await import('node:path');
  const out = path.join(process.cwd(), 'scripts', 'qa-sales-path-dry-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('\nRaport JSON:', out);

  process.exit(bad > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
