#!/usr/bin/env node
/**
 * Pełny test A→Z Turniejomat (produkcja) + viewporty telefon/tablet/iPhone.
 * Uruchom: node scripts/qa-full-az-report.mjs
 *
 * Zapisuje: scripts/qa-full-az-report.json
 */
import { chromium, devices } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const REPORT_PATH = join(__dir, 'qa-full-az-report.json');

const APP = process.env.APP_URL || 'https://app.turniejomat.pl';
const DEMO = process.env.DEMO_URL || 'https://demo.turniejomat.pl';
const LANDING = process.env.LANDING_URL || 'https://turniejomat.pl';

const startedAt = new Date().toISOString();
const results = [];

function add(area, label, ok, detail = '', severity = 'critical') {
  results.push({
    area,
    label,
    ok: !!ok,
    detail: String(detail || ''),
    severity: ok ? 'pass' : severity,
  });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark.padEnd(4)} [${area}] ${label}${detail ? ' — ' + detail : ''}`);
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, { redirect: 'follow', ...opts });
  const text = await res.text();
  return { status: res.status, text, url: res.url, headers: res.headers };
}

function runNodeScript(relPath, label, area = 'Unit') {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) {
    add(area, label, false, `brak pliku ${relPath}`, 'warning');
    return;
  }
  const r = spawnSync(process.execPath, [full], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env },
  });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().slice(-400);
  add(area, label, r.status === 0, r.status === 0 ? 'exit 0' : `exit ${r.status}: ${out}`, r.status === 0 ? 'pass' : 'critical');
}

const VIEWPORTS = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, isMobile: true, hasTouch: true },
  { id: 'iphone-14', label: 'iPhone 14', width: 390, height: 844, isMobile: true, hasTouch: true },
  { id: 'iphone-14-pro-max', label: 'iPhone 14 Pro Max', width: 430, height: 932, isMobile: true, hasTouch: true },
  { id: 'android-phone', label: 'Android phone 6–7"', width: 360, height: 800, isMobile: true, hasTouch: true },
  { id: 'android-phone-wide', label: 'Android phone landscape', width: 800, height: 360, isMobile: true, hasTouch: true },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { id: 'ipad-pro', label: 'iPad Pro 11"', width: 834, height: 1194, isMobile: true, hasTouch: true },
  { id: 'tablet-10', label: 'Tablet 10" landscape', width: 1024, height: 768, isMobile: false, hasTouch: true },
  { id: 'laptop', label: 'Laptop 14"', width: 1366, height: 768, isMobile: false, hasTouch: false },
  { id: 'monitor-24', label: 'Monitor ~24"', width: 1920, height: 1080, isMobile: false, hasTouch: false },
];

async function smokeHttp() {
  console.log('\n=== HTTP / deploy smoke ===');

  for (const [name, url] of [
    ['Landing', LANDING],
    ['Landing /dziekujemy', LANDING + '/dziekujemy.html'],
    ['Landing /platnosci', LANDING + '/platnosci.html'],
    ['App', APP + '/'],
    ['Demo', DEMO + '/'],
  ]) {
    try {
      const { status, text } = await fetchText(url);
      add('HTTP', name, status === 200, `HTTP ${status}, ${text.length} B`);
    } catch (e) {
      add('HTTP', name, false, e.message);
    }
  }

  try {
    const app = await fetchText(APP + '/');
    add('Deploy', 'App: polling Na żywo (shouldPoll)', /shouldPoll/.test(app.text), 'marker JS');
    add('Deploy', 'App: tabela asystenta', /assistant-screen \.live-match-table/.test(app.text), 'marker CSS');
    add('Deploy', 'App: playoff table wrap', /live-match-table-wrap--playoff/.test(app.text));
    add('Deploy', 'App: brak sekretów w HTML', !/SHARED_KEY|SMTP_PASS|AUTOPAY_SHARED/i.test(app.text));
    add('Deploy', 'App: TP_BREAKPOINTS', /TP_BREAKPOINTS/.test(app.text));
  } catch (e) {
    add('Deploy', 'App markers', false, e.message);
  }

  try {
    const demo = await fetchText(DEMO + '/');
    add('Deploy', 'Demo = ten sam build co app (shouldPoll)', /shouldPoll/.test(demo.text));
    add('Deploy', 'Demo: Demo Story controller', /DemoStoryController/.test(demo.text));
  } catch (e) {
    add('Deploy', 'Demo markers', false, e.message);
  }

  try {
    const land = await fetchText(LANDING + '/');
    add('Landing', 'pakiet miesięczny (copy)', /pakiet miesi[eę]czny/i.test(land.text) || /miesi[eę]czn/i.test(land.text), 'szukaj copy cennika');
    add('Landing', 'checkout / cennik', /cennik|checkout|createCheckout/i.test(land.text));
    add('Landing', 'responsive CSS link', /responsive\.css/.test(land.text));
  } catch (e) {
    add('Landing', 'Landing content', false, e.message);
  }
}

async function clickDemoNext(page) {
  const btn = page.locator('#view-demo-story .demo-screen.active [data-demo-action="next"]').first();
  await btn.click({ timeout: 8000 });
  await page.waitForTimeout(450);
}

async function ensureDemoStoryReady(page) {
  await page.goto(DEMO + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(
    () => typeof window.DemoStoryController !== 'undefined',
    { timeout: 25000 }
  );
  await page.waitForFunction(
    () => {
      const v = document.getElementById('view-demo-story');
      return !!(v && v.classList.contains('active') && window.DemoStoryController?.isActive?.());
    },
    { timeout: 25000 }
  ).catch(async () => {
    await page.waitForTimeout(1200);
  });
  const active = await page.evaluate(() => ({
    view: !!document.getElementById('view-demo-story')?.classList.contains('active'),
    isActive: !!window.DemoStoryController?.isActive?.(),
  }));
  if (!active.view || !active.isActive) {
    await page.evaluate(() => {
      if (window.DemoStoryController?.showEntry) window.DemoStoryController.showEntry();
    });
    await page.waitForTimeout(600);
  }
}

async function goDemoToStep(page, targetStep) {
  await ensureDemoStoryReady(page);
  const jumped = await page.evaluate((step) => {
    try {
      return !!window.DemoStoryController?.goTo?.(step);
    } catch {
      return false;
    }
  }, targetStep);
  if (jumped) {
    await page.waitForTimeout(700);
    return page.evaluate(() => window.DemoStoryController?.getStep?.() ?? -1);
  }
  for (let i = 0; i < 14; i++) {
    const step = await page.evaluate(() => window.DemoStoryController?.getStep?.() ?? -1);
    if (step === targetStep) return step;
    if (step > targetStep) return step;
    try {
      await clickDemoNext(page);
    } catch {
      break;
    }
  }
  return page.evaluate(() => window.DemoStoryController?.getStep?.() ?? -1);
}

async function auditViewport(browser, vp) {
  const area = `Viewport:${vp.id}`;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: !!vp.isMobile,
    hasTouch: !!vp.hasTouch,
    userAgent: vp.id.startsWith('iphone')
      ? devices['iPhone 14'].userAgent
      : undefined,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    // --- Fan (step 2) ---
    const stepFan = await goDemoToStep(page, 2);
    add(area, `${vp.label}: Demo → kibic (step 2)`, stepFan === 2, `step=${stepFan}`);

    await page.waitForTimeout(700);
    const fan = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('.demo-fan-tab')].map((t) => t.textContent.trim());
      const host = document.getElementById('demo-fan-embed-host');
      const table = host?.querySelector('.live-match-table');
      const cards = host?.querySelectorAll('.assistant-match-card, .match-card--po');
      const filters = host?.querySelector('.filter-bar, #match-filter-bar');
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
      return {
        tabs,
        hasTable: !!table,
        tableRows: table ? table.querySelectorAll('tbody tr').length : 0,
        poCards: cards ? cards.length : 0,
        hasFilters: !!filters,
        overflowX,
        embedW: host ? Math.round(host.getBoundingClientRect().width) : 0,
        vw: window.innerWidth,
      };
    });
    add(area, `${vp.label}: kibic — zakładki Mecze/Tabele/Play-Off`, fan.tabs.length >= 3, fan.tabs.join(', '));
    add(area, `${vp.label}: kibic — tabela meczów (nie karty PO)`, fan.hasTable && fan.tableRows > 0, `rows=${fan.tableRows}, poCards=${fan.poCards}`);
    add(area, `${vp.label}: kibic — brak horizontal overflow`, !fan.overflowX, `scrollW vs vw=${fan.vw}`);

    // Switch Play-Off tab
    const poTab = page.locator('.demo-fan-tab[data-demo-fan-tab="playoff"]').first();
    if (await poTab.count()) {
      await poTab.click();
      await page.waitForTimeout(500);
      const poView = await page.evaluate(() => {
        const host = document.getElementById('demo-fan-embed-host') || document.body;
        const wrap = host.querySelector('.live-match-table-wrap--playoff, #playoff-container .live-match-table');
        const cards = host.querySelectorAll('#playoff-container .match-card--po, .assistant-match-card');
        return { hasPoTable: !!wrap, cardCount: cards.length };
      });
      add(area, `${vp.label}: kibic Play-Off — tabela`, poView.hasPoTable, `cards=${poView.cardCount}`);
    } else {
      add(area, `${vp.label}: kibic Play-Off tab`, false, 'brak tab', 'warning');
    }

    // Tabele tab
    const tabTabele = page.locator('.demo-fan-tab[data-demo-fan-tab="tabele"]').first();
    if (await tabTabele.count()) {
      await tabTabele.click();
      await page.waitForTimeout(500);
      const tables = await page.evaluate(() => {
        const host = document.getElementById('demo-fan-embed-host') || document.body;
        const cards = host.querySelectorAll('.standings-group-card, #tables-container .card');
        const adv = host.querySelectorAll('.advancing-row');
        return { groups: cards.length, advancing: adv.length };
      });
      add(area, `${vp.label}: kibic Tabele — grupy + awans`, tables.groups >= 1, `groups=${tables.groups}, advancing=${tables.advancing}`);
    }

    // --- Organizer (step 3) — Tabele na żywo ---
    const stepOrg = await goDemoToStep(page, 3);
    add(area, `${vp.label}: Demo → organizator (step 3)`, stepOrg === 3, `step=${stepOrg}`);
    await page.waitForTimeout(900);
    const org = await page.evaluate(() => {
      const liveHost = document.getElementById('demo-live-embed-host');
      const standings = liveHost?.querySelectorAll('.standings-group-card, #live-tables-container .standings-table');
      const hallDump = liveHost?.querySelector('.hall-po-panel');
      const rawTextHint = (liveHost?.innerText || '').includes('Mecz #25') && !(standings && standings.length);
      const scheduleTable = liveHost?.querySelector('#live-matches-container .live-match-table, .live-match-table');
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
      const hallHost = document.getElementById('demo-hall-embed-host');
      const hallTitle = document.getElementById('hall-title')?.textContent || '';
      return {
        standingsN: standings ? standings.length : 0,
        hasHallDump: !!hallDump,
        rawTextHint: !!rawTextHint,
        hasSchedule: !!scheduleTable,
        overflowX,
        hallTitle: hallTitle.slice(0, 60),
        hallVisible: !!(hallHost && hallHost.offsetParent !== null && hallHost.innerText.trim().length > 20),
      };
    });
    add(area, `${vp.label}: Na żywo — tabele grup (nie raw hall)`, org.standingsN > 0 && !org.hasHallDump && !org.rawTextHint, `standings=${org.standingsN}, hallDump=${org.hasHallDump}`);
    add(area, `${vp.label}: Na żywo — harmonogram`, org.hasSchedule || org.standingsN > 0, `schedule=${org.hasSchedule}`);
    add(area, `${vp.label}: organizator — brak H-overflow`, !org.overflowX);
    add(area, `${vp.label}: Hala embed widoczny`, org.hallVisible, org.hallTitle || '—', 'warning');

    add(area, `${vp.label}: brak pageerror JS`, pageErrors.length === 0, pageErrors.slice(0, 2).join(' | ') || 'ok');
  } catch (e) {
    add(area, `${vp.label}: wyjątek suite`, false, e.message);
  } finally {
    await context.close();
  }
}

async function appGatewaySmoke(browser) {
  console.log('\n=== App gateway / UI markers ===');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(APP + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => ({
      hasKeyInput: !!(document.querySelector('#license-key, input[name="key"], #key-input, input[placeholder*="klucz" i], input[type="text"]')),
      title: document.title,
      bodyLen: document.body?.innerText?.length || 0,
      hasViewApp: !!document.getElementById('view-app'),
      assistantCss: !!document.querySelector('style') || /assistant-screen/.test(document.documentElement.innerHTML),
    }));
    add('App', 'Bramka / shell ładuje się', info.bodyLen > 100, `title=${info.title}`);
    add('App', '#view-app obecny', info.hasViewApp);
  } catch (e) {
    add('App', 'App load', false, e.message);
  } finally {
    await page.close();
  }
}

async function demoStoryFullFlow(browser) {
  console.log('\n=== Demo Story E0→E6 (desktop) ===');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    const step = await goDemoToStep(page, 4);
    add('DemoStory', 'Dotarcie do finału (step 4)', step === 4, `step=${step}`);

    if (step === 4) {
      await page.fill('#demo-final-g1', '2');
      await page.fill('#demo-final-g2', '1');
      await page.locator('#view-demo-story .demo-screen.active [data-demo-action="save-final"]').click();
      await page.waitForFunction(() => (window.DemoStoryController?.getStep?.() ?? 0) >= 5, { timeout: 10000 }).catch(() => {});
      const after = await page.evaluate(() => ({
        step: window.DemoStoryController?.getStep?.(),
        saved: window.DemoStoryController?.isFinalSaved?.(),
        text: (document.getElementById('view-demo-story')?.innerText || '').slice(0, 200),
      }));
      add('DemoStory', 'Zapis finału → podium (step 5)', after.step === 5 && after.saved, `step=${after.step}, saved=${after.saved}`);
    }

    add('DemoStory', 'brak pageerror', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ok');
  } catch (e) {
    add('DemoStory', 'Flow exception', false, e.message);
  } finally {
    await page.close();
  }
}

function summarize() {
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const criticalFail = results.filter((r) => !r.ok && r.severity === 'critical').length;
  const warnFail = results.filter((r) => !r.ok && r.severity === 'warning').length;
  const byArea = {};
  for (const r of results) {
    if (!byArea[r.area]) byArea[r.area] = { pass: 0, fail: 0 };
    byArea[r.area][r.ok ? 'pass' : 'fail']++;
  }
  return { total, passed, failed, criticalFail, warnFail, byArea, passRate: total ? Math.round((passed / total) * 1000) / 10 : 0 };
}

async function main() {
  console.log('Turniejomat FULL A→Z QA');
  console.log('APP', APP);
  console.log('DEMO', DEMO);
  console.log('LANDING', LANDING);
  console.log('started', startedAt);

  await smokeHttp();

  console.log('\n=== Unit / module scripts ===');
  runNodeScript('scripts/qa-assistant-module.mjs', 'Asystent token + save LIVE (mock)');
  runNodeScript('scripts/qa-autopay-hash.mjs', 'Autopay hash');
  runNodeScript('scripts/qa-autopay-itn.mjs', 'Autopay ITN XML');

  // Reuse last payment audit if present
  const payReport = join(__dir, 'qa-payment-audit-live-report.json');
  if (existsSync(payReport)) {
    try {
      const prev = JSON.parse(readFileSync(payReport, 'utf8'));
      const p = prev.summary || prev;
      add(
        'Payments',
        'Ostatni audyt Autopay (cache raportu)',
        (p.failed === 0 || p.criticalFail === 0) && (p.passed || p.total),
        `passed=${p.passed}/${p.total} @ ${prev.startedAt || prev.when || '?'}`,
        'warning'
      );
    } catch {
      add('Payments', 'Odczyt raportu płatności', false, 'parse error', 'warning');
    }
  } else {
    add('Payments', 'Raport Autopay', false, 'brak qa-payment-audit-live-report.json — uruchom osobno jeśli potrzeba', 'warning');
  }

  const browser = await chromium.launch({ headless: true });
  try {
    await appGatewaySmoke(browser);
    await demoStoryFullFlow(browser);

    console.log('\n=== Viewport matrix ===');
    for (const vp of VIEWPORTS) {
      console.log(`\n-- ${vp.label} (${vp.width}x${vp.height}) --`);
      await auditViewport(browser, vp);
    }
  } finally {
    await browser.close();
  }

  const summary = summarize();
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    targets: { APP, DEMO, LANDING },
    summary,
    viewports: VIEWPORTS.map((v) => ({ id: v.id, label: v.label, width: v.width, height: v.height })),
    results,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('Report:', REPORT_PATH);
  process.exit(summary.criticalFail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
