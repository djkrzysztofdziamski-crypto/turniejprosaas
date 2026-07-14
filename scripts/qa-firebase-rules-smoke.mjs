/**
 * Smoke test po wdrożeniu database.rules.json
 * Użycie: APP_URL=http://127.0.0.1:8765/index.html LICENSE_KEY=TP-XXXX node scripts/qa-firebase-rules-smoke.mjs
 */
import { chromium } from 'playwright';

const LICENSE = process.env.LICENSE_KEY || 'TP-5YGF-ZS4S';
const BASE = process.env.APP_URL || 'https://app.turniejomat.pl/';
const LOCAL = BASE.includes('127.0.0.1') || BASE.includes('localhost');

const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('dialog', async (d) => {
  try { await d.accept(); } catch (_) {}
});

try {
  // ── 1. Bramka: logowanie aktywnym kluczem ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#license-input', { timeout: 15000 });
  await page.fill('#license-input', LICENSE);

  const licReadOnGate = await page.evaluate(async (key) => {
    try {
      const snap = await firebase.database().ref('licencje/' + key).once('value');
      return { ok: true, status: snap.val()?.status || null };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, LICENSE);

  if (licReadOnGate.ok && licReadOnGate.status) {
    pass('Bramka: odczyt licencji', `status=${licReadOnGate.status}`);
  } else {
    fail('Bramka: odczyt licencji', licReadOnGate.error || 'brak danych');
  }

  await page.click('button:has-text("MAM KLUCZ")');
  await page.waitForFunction(
    (key) => location.search.includes('id=' + encodeURIComponent(key)),
    LICENSE,
    { timeout: 20000 }
  ).catch(() => null);

  const afterLogin = await page.evaluate(() => ({
    url: location.href,
    viewApp: document.getElementById('view-app')?.classList.contains('active'),
    msg: document.getElementById('msg-box')?.innerText || '',
    blocked: document.getElementById('license-blocked-screen')?.style.display,
  }));

  if (afterLogin.viewApp && afterLogin.url.includes(LICENSE)) {
    pass('Bramka: wejście organizatora', afterLogin.url);
  } else if (/aktywowana|Witamy|poprawny/i.test(afterLogin.msg)) {
    await page.waitForTimeout(2000);
    const url2 = page.url();
    if (url2.includes(LICENSE)) pass('Bramka: wejście organizatora', url2);
    else fail('Bramka: wejście organizatora', `url=${url2} msg=${afterLogin.msg}`);
  } else {
    fail('Bramka: wejście organizatora', JSON.stringify(afterLogin));
  }

  // ── 2. Zapis wyniku (log testowy → Firebase) ──
  await page.waitForSelector('#view-app.active', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const writeTest = await page.evaluate(async (key) => {
    const stamp = `[QA-RULES ${new Date().toISOString()}] test zapisu po regułach`;
    const ref = firebase.database().ref('turnieje_uzytkownikow/' + key);
    const snap = await ref.once('value');
    const data = snap.val() || {};
    const logs = Array.isArray(data.logs) ? [...data.logs] : [];
    logs.push(stamp);
    try {
      await ref.update({ logs });
      const verify = (await ref.child('logs').once('value')).val() || [];
      const found = verify.some((l) => String(l).includes('QA-RULES'));
      return { ok: found, stamp };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, LICENSE);

  if (writeTest.ok) {
    pass('Organizator: zapis do RTDB', writeTest.stamp);
  } else {
    fail('Organizator: zapis do RTDB', writeTest.error || 'wpis nie znaleziony');
  }

  // ── 3. Widok kibica ──
  try {
    const origin = new URL(BASE).origin;
    const fanUrl = `${origin}/?view=fan&id=${encodeURIComponent(LICENSE)}`;
    await page.goto(fanUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(() => typeof firebase !== 'undefined' && !!firebase.database, { timeout: 25000 });
    await page.waitForSelector('#view-app.active', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const fan = await page.evaluate(async (key) => {
      const readOk = await firebase.database().ref('turnieje_uzytkownikow/' + key).once('value').then((s) => !!s.val()).catch(() => false);
      return {
        viewApp: document.getElementById('view-app')?.classList.contains('active'),
        fanSkin: document.body.classList.contains('fan-view'),
        header: document.getElementById('app-header-title')?.innerText || '',
        matchCards: document.querySelectorAll('.match-card, .bracket-match').length,
        readOk,
      };
    }, LICENSE);

    if (fan.viewApp && fan.readOk && (fan.fanSkin || fan.header.includes('KIBIC'))) {
      pass('Kibic: odczyt live', `karty=${fan.matchCards}, header=${fan.header.slice(0, 40)}…`);
    } else {
      fail('Kibic: odczyt live', JSON.stringify(fan));
    }
  } catch (e) {
    fail('Kibic: odczyt live', e.message);
  }

  // ── 4. Panel admina (bez hasła — reguły + UI) ──
  try {
    const adminUrl = LOCAL
      ? `${new URL(BASE).origin}/?view=admin`
      : 'https://admin.turniejomat.pl/';
    await page.goto(adminUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(() => typeof firebase !== 'undefined' && !!firebase.database, { timeout: 25000 });
    await page.waitForSelector('#view-admin.active', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const admin = await page.evaluate(async () => {
      let listDenied = false;
      try {
        await firebase.database().ref('licencje').once('value');
      } catch (e) {
        listDenied = /permission/i.test(e.message);
      }
      return {
        viewAdmin: document.getElementById('view-admin')?.classList.contains('active'),
        authLock: document.getElementById('auth-lock')?.style.display !== 'none',
        listDenied,
        tbody: document.getElementById('licenses-table-body')?.innerText?.slice(0, 80) || '',
      };
    });

    if (admin.viewAdmin && admin.authLock && admin.listDenied) {
      pass('Admin: UI + blokada listy licencji', 'wymaga logowania Firebase Auth');
    } else {
      fail('Admin: UI + blokada listy licencji', JSON.stringify(admin));
    }
  } catch (e) {
    fail('Admin: UI + blokada listy licencji', e.message);
  }

  // ── REST: enumeracja zablokowana ──
  try {
    const rest = await page.evaluate(async () => {
      const r = await fetch('https://turniejprosaas-default-rtdb.europe-west1.firebasedatabase.app/licencje.json?shallow=true');
      const body = await r.json();
      return { status: r.status, denied: body?.error === 'Permission denied' };
    });

    if (rest.denied) {
      pass('REST: brak enumeracji licencji', `HTTP ${rest.status}`);
    } else {
      fail('REST: brak enumeracji licencji', JSON.stringify(rest));
    }
  } catch (e) {
    fail('REST: brak enumeracji licencji', e.message);
  }

  // ── REST: klient nie może aktywować licencji ──
  try {
    const clientAct = await page.evaluate(async () => {
      try {
        await firebase.database().ref('licencje/TP-TEST-TEST').update({
          status: 'aktywny',
          aktywowany: Date.now(),
          wygasa: Date.now() + 86400000,
        });
        return { blocked: false };
      } catch (e) {
        return { blocked: /permission/i.test(e.message), error: e.message };
      }
    });
    if (clientAct.blocked) {
      pass('Strict: klient nie aktywuje licencji', clientAct.error || 'Permission denied');
    } else {
      fail('Strict: klient nie aktywuje licencji', 'zapis z przeglądarki dozwolony');
    }
  } catch (e) {
    fail('Strict: klient nie aktywuje licencji', e.message);
  }

} catch (e) {
  fail('Błąd krytyczny (bramka/organizator)', e.message);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log('\n--- PODSUMOWANIE ---');
console.log(`${results.length - failed.length}/${results.length} testów OK`);
if (failed.length) {
  console.error('Nieudane:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
