/**
 * Audyt regresji responsywności — runtime overflow / clipped / MQ
 * Użycie: node scripts/qa-responsive-regression.mjs
 * Loguje do debug ingest (session 1690ee) + scripts/qa-responsive-regression-report.json
 */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync, statSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LANDING = path.join(ROOT, 'landing');
const INGEST = 'http://127.0.0.1:7322/ingest/49384c5c-009d-435f-a4da-8bed183b9f00';
const SESSION = '1690ee';
const LOG_FILE = path.join(ROOT, 'debug-1690ee.log');

const MOBILE = [320, 360, 375, 390, 393, 412, 414, 430];
const TABLET_L = [1024, 1180, 1194, 1280, 1366];
const DESKTOP = [1440, 1600, 1920];
const ALL_W = [...MOBILE, ...TABLET_L, ...DESKTOP];

const findings = [];
const measurements = [];

function mime(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function startStatic(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const file = path.join(dir, urlPath.replace(/^\//, ''));
      if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('404'); return;
      }
      res.writeHead(200, { 'Content-Type': mime(file) });
      createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function dbg(hypothesisId, message, data) {
  const payload = {
    sessionId: SESSION,
    runId: 'ux3-full-audit',
    hypothesisId,
    location: 'qa-responsive-regression.mjs',
    message,
    data,
    timestamp: Date.now()
  };
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n');
  } catch (_) {}
  try {
    await fetch(INGEST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
      body: JSON.stringify(payload)
    });
  } catch (_) {}
}

function addFinding(sev, view, width, file, component, cause, impact, fix, evidence) {
  findings.push({ severity: sev, view, width, file, component, cause, impact, fix, evidence });
}

async function measurePage(page, view, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(120);
  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollX = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0) - window.innerWidth;
    const offenders = [];
    const nodes = document.querySelectorAll('header, footer, nav, .nav-tabs, .container, .wrap, .card, .live-match-table, .assistant-match-cards, .playoff-bracket, .pricing-grid, .autopay-methods, .demo-embed-app, .hall-grid, #view-admin .container, .login-card, .demo-h1, .awards-banner, .podium-top-grid, .modal-content, .match-modal-content, .share-modal-content, .match-modal-score-row');
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && String(el.className).slice(0, 80)) || '',
          id: el.id || '',
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width)
        });
      }
    });
    const navDesktop = document.querySelectorAll('.nav-desktop-only');
    const navMobile = document.querySelectorAll('.nav-mobile-only');
    const navDesktopVisible = [...navDesktop].filter((el) => getComputedStyle(el).display !== 'none').length;
    const navMobileVisible = [...navMobile].filter((el) => getComputedStyle(el).display !== 'none').length;
    const cards = document.querySelectorAll('.assistant-match-card').length;
    const tables = document.querySelectorAll('.live-match-table').length;
    const autopayMin = (() => {
      const img = document.querySelector('.autopay-methods__img');
      if (!img) return null;
      return { minWidth: getComputedStyle(img).minWidth, width: Math.round(img.getBoundingClientRect().width) };
    })();
    const preferCards = typeof window.tpPreferMatchCards === 'function' ? window.tpPreferMatchCards() : null;
    const bpDesktop = window.TP_BREAKPOINTS ? window.TP_BREAKPOINTS.desktop : null;
    // Contained overflow (not page scroll) — live tables / admin wraps
    const containerOverflow = [];
    document.querySelectorAll('.admin-table-wrap, .live-split, .matches-render-target, .modal-content, .playoff-bracket').forEach((el) => {
      const excess = el.scrollWidth - el.clientWidth;
      if (excess > 4) {
        containerOverflow.push({
          id: el.id || '',
          cls: (el.className && String(el.className).slice(0, 60)) || '',
          excess: Math.round(excess)
        });
      }
    });
    return {
      innerWidth: window.innerWidth,
      scrollWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
      overflowX: scrollX,
      htmlScrollWidth: doc.scrollWidth,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      htmlOverflowX: getComputedStyle(doc).overflowX,
      bodyOverflowX: body ? getComputedStyle(body).overflowX : null,
      offenders: offenders.slice(0, 8),
      navDesktopVisible,
      navMobileVisible,
      cards,
      tables,
      autopayMin,
      preferCards,
      bpDesktop,
      containerOverflow
    };
  });
  measurements.push({ view, width, height, ...m });
  return m;
}

function band(width) {
  if (width <= 479) return 'MP';
  if (width <= 767) return 'LMP';
  if (width <= 1365) return 'TL';
  if (width < 1920) return 'D';
  return 'LD';
}

async function auditView(page, viewName, setupFn) {
  for (const width of ALL_W) {
    const height = MOBILE.includes(width) ? 800 : (TABLET_L.includes(width) ? 768 : 900);
    if (setupFn) await setupFn(page, width);
    const m = await measurePage(page, viewName, width, height);
    const hyp =
      viewName === 'landing' ? 'D' :
      viewName.startsWith('demo') ? 'F' :
      viewName.startsWith('modal') ? 'G' :
      viewName.includes('fan') || viewName.includes('assistant') ? 'B' :
      viewName === 'admin' ? 'E' : 'A';

    await dbg(hyp, `${viewName}@${width}`, {
      overflowX: m.overflowX,
      offenders: m.offenders.length,
      navDesktopVisible: m.navDesktopVisible,
      navMobileVisible: m.navMobileVisible,
      preferCards: m.preferCards,
      cards: m.cards,
      tables: m.tables,
      autopayMin: m.autopayMin,
      band: band(width)
    });

    if (m.overflowX > 2) {
      const sev = m.overflowX > 20 ? 'CRITICAL' : (m.overflowX > 8 ? 'HIGH' : 'MEDIUM');
      addFinding(sev, viewName, width,
        viewName === 'landing' ? 'landing/*' : 'index.html / css/responsive.css',
        'page document',
        `document.scrollWidth − innerWidth = ${m.overflowX}px`,
        'Horizontal scroll / treść wychodzi poza ekran',
        'Znaleźć offender (width/min-width/100vw) i ograniczyć do 100%',
        m.offenders
      );
    }

    // H-A: tablet landscape should not be treated as "desktop" for nav (desktop starts 1366)
    if (viewName === 'login-or-app' || viewName.startsWith('fan') || viewName === 'organizer') {
      if (width >= 768 && width <= 1365 && m.navDesktopVisible > 0 && width < 1366) {
        // desktop-only visible below 1366 = bug (should be hidden)
        addFinding('HIGH', viewName, width, 'index.html', 'nav-tabs .nav-desktop-only',
          'Przy BP desktop=1366 przyciski desktop-only powinny być ukryte ≤1365',
          'Na iPad landscape może być zła nawigacja',
          'Sprawdź MQ max-width:1365 dla .nav-desktop-only',
          { navDesktopVisible: m.navDesktopVisible });
      }
      if (width >= 1366 && m.navMobileVisible > 0 && m.navDesktopVisible === 0) {
        addFinding('MEDIUM', viewName, width, 'index.html', 'nav-tabs',
          'Na desktopie widoczne tylko mobile nav',
          'Brak zakładki Na żywo na szerokim ekranie',
          'Sprawdź MQ min-width:1366',
          { navMobileVisible: m.navMobileVisible });
      }
    }

    // H-B: cards expected ≤767 when matches rendered
    if ((viewName === 'assistant-cards' || viewName === 'fan-matches') && width <= 767) {
      if (m.preferCards !== true) {
        addFinding('CRITICAL', viewName, width, 'index.html', 'tpPreferMatchCards',
          'preferCards=false poniżej 768',
          'Asystent/kibic wraca do wąskiej tabeli',
          'Napraw TP_BREAKPOINTS.phoneMax / tpPreferMatchCards',
          { preferCards: m.preferCards });
      }
    }

    // H-D: autopay
    if (viewName === 'landing' && m.autopayMin && width <= 479) {
      const mw = parseFloat(m.autopayMin.minWidth) || 0;
      if (mw > width) {
        addFinding('CRITICAL', viewName, width, 'landing/index.html', '.autopay-methods__img',
          `min-width ${m.autopayMin.minWidth} > viewport ${width}`,
          'Pasek płatności wymusza horizontal scroll',
          'Usuń min-width / ustaw width:100%',
          m.autopayMin);
      }
    }

    // clipped offenders beyond page overflow
    if (m.offenders.length && m.overflowX <= 2) {
      addFinding('MEDIUM', viewName, width,
        viewName === 'landing' ? 'landing/*' : 'index.html',
        m.offenders[0].cls || m.offenders[0].id || m.offenders[0].tag,
        'Element(y) wychodzą poza viewport mimo małego page overflow',
        'Możliwe przycięcie / niedostępność CTA',
        'Dodaj min-width:0 / overflow-wrap / stack',
        m.offenders.slice(0, 3));
    }
  }
}

const browser = await chromium.launch({ headless: true });
let appServer; let landServer;
const APP_PORT = 8765;
const LAND_PORT = 8766;

try {
  appServer = await startStatic(ROOT, APP_PORT);
  landServer = await startStatic(LANDING, LAND_PORT);
  const page = await browser.newPage();
  page.on('dialog', async (d) => { try { await d.accept(); } catch (_) {} });

  await dbg('SETUP', 'servers up', { APP_PORT, LAND_PORT });

  // 1) LANDING
  await page.goto(`http://127.0.0.1:${LAND_PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await auditView(page, 'landing');

  // 2) LOGIN (app gate)
  await page.goto(`http://127.0.0.1:${APP_PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#view-login', { timeout: 15000 });
  await auditView(page, 'login');

  // 3) DEMO STORY — start lokalnie + Final + Podium
  await page.goto(`http://127.0.0.1:${APP_PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => !!window.DemoStoryController, null, { timeout: 15000 });
  const started = await page.evaluate(() => {
    try {
      return !!(window.DemoStoryController && DemoStoryController.start && DemoStoryController.start('regression-audit'));
    } catch (e) {
      return String(e);
    }
  });
  await dbg('F', 'demo start', { started });
  if (started === true) {
    await page.waitForSelector('#view-demo-story.active', { timeout: 10000 });
    // Final step id=4
    await page.evaluate(() => DemoStoryController.goTo(4));
    await page.waitForTimeout(200);
    await auditView(page, 'demo-final');
    // Force podium if final saved — try goTo(5); if blocked, inject step
    const toPodium = await page.evaluate(() => {
      const ok = DemoStoryController.goTo(5);
      if (ok) return 'goTo5';
      // force render podium for layout audit
      try {
        if (DemoStoryController.isFinalSaved && DemoStoryController.isFinalSaved()) return 'blocked-but-saved';
        // mark final saved via internal if exposed
        const sc = document.querySelector('#view-demo-story .demo-screen[data-step="5"]');
        return { ok, hasStep5: !!sc };
      } catch (e) {
        return String(e);
      }
    });
    await dbg('F', 'demo podium attempt', { toPodium });
    if (toPodium === 'goTo5') {
      await auditView(page, 'demo-podium');
    } else {
      const saved = await page.evaluate(() => {
        try {
          if (typeof DemoStoryController.saveFinalScore === 'function') {
            DemoStoryController.saveFinalScore(2, 1, null, null);
          }
          return DemoStoryController.goTo(5);
        } catch (e) {
          return String(e);
        }
      });
      await dbg('F', 'demo podium after saveFinalScore', { saved });
      if (saved === true) await auditView(page, 'demo-podium');
      else await auditView(page, 'demo-final-fallback');
    }
  } else {
    addFinding('HIGH', 'demo', 390, 'demo-story.js', 'DemoStoryController.start',
      `Nie udało się uruchomić demo lokalnie: ${started}`,
      'Brak pomiaru Demo Story',
      'Uruchom demo.turniejomat.pl lub napraw start lokalny',
      { started });
  }

  // 4) ADMIN view (UI shell without auth success — unlock overlay for layout)
  await page.goto(`http://127.0.0.1:${APP_PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const admin = document.getElementById('view-admin');
    if (admin) admin.classList.add('active');
    const lock = document.getElementById('auth-lock');
    if (lock) lock.style.display = 'none';
  });
  await auditView(page, 'admin');

  // 5) Prefer-cards helper + synthetic assistant markup (re-inject per viewport — app init czyści DOM)
  const injectAssistant = async () => {
    const info = await page.evaluate(() => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const app = document.getElementById('view-app');
      if (app) app.classList.add('active');
      document.body.classList.add('assistant-view');
      const lock = document.getElementById('auth-lock');
      if (lock) lock.style.display = 'none';
      const asst = document.getElementById('assistant-screen');
      if (asst) {
        asst.style.display = 'block';
        asst.setAttribute('aria-hidden', 'false');
      }
      let cont = document.getElementById('assistant-matches-container');
      if (!cont && app) {
        cont = document.createElement('div');
        cont.id = 'assistant-matches-container';
        cont.className = 'matches-render-target';
        app.appendChild(cont);
      }
      if (cont) {
        cont.innerHTML = '<div class="assistant-match-cards">' +
          '<article class="assistant-match-card"><div class="assistant-match-card-head"><span>#1</span></div>' +
          '<div class="assistant-match-card-teams"><span class="live-team-name">Alpha FC Very Long Club Name</span><span class="live-teams-vs">vs</span><span class="live-team-name">Beta United Extremely Long</span></div>' +
          '<div class="assistant-match-card-actions"><span class="live-score-cell"><span class="live-score-inputs"><input value="0"><span>:</span><input value="0"></span></span></div></article>' +
          '<article class="assistant-match-card"><div class="assistant-match-card-head"><span>#2</span></div>' +
          '<div class="assistant-match-card-teams"><span class="live-team-name">Gamma</span><span class="live-teams-vs">vs</span><span class="live-team-name">Delta</span></div></article></div>';
      }
      const nav = document.querySelector('.nav-tabs');
      if (nav) nav.style.display = 'flex';
      return {
        hasCont: !!cont,
        cards: document.querySelectorAll('.assistant-match-card').length,
        appActive: !!app && app.classList.contains('active')
      };
    });
    return info;
  };
  await page.goto(`http://127.0.0.1:${APP_PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(400);
  const asstInject = await injectAssistant();
  await dbg('B', 'assistant inject', asstInject);
  if (!asstInject.cards) {
    addFinding('MEDIUM', 'assistant-cards', 390, 'index.html', '#assistant-matches-container',
      'Nie udało się wstrzyknąć syntetycznych kart meczów do audytu',
      'Audyt layoutu kart asystenta niepełny — wymaga ręcznego QA',
      'Ręczny test asystenta z QR / licencją',
      asstInject);
  }
  await auditView(page, 'assistant-cards', async () => { await injectAssistant(); });

  // 5b) Fan matches shell (syntetyczny)
  const injectFan = async () => {
    return page.evaluate(() => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const app = document.getElementById('view-app');
      if (app) app.classList.add('active');
      document.body.classList.add('fan-view');
      const lock = document.getElementById('auth-lock');
      if (lock) lock.style.display = 'none';
      let cont = document.getElementById('matches-container') || document.getElementById('live-matches-container');
      if (!cont && app) {
        cont = document.createElement('div');
        cont.id = 'matches-container';
        cont.className = 'matches-render-target';
        app.appendChild(cont);
      }
      if (cont) {
        cont.innerHTML = '<div class="assistant-match-cards">' +
          '<article class="assistant-match-card"><div class="assistant-match-card-teams">' +
          '<span class="live-team-name">Klub Sportowy Piłka Nożna Warszawa 2026</span><span class="live-teams-vs">vs</span>' +
          '<span class="live-team-name">Akademia Młodych Talentów Kraków</span></div></article></div>';
      }
      return { cards: document.querySelectorAll('.assistant-match-card').length };
    });
  };
  const fanInject = await injectFan();
  await dbg('B', 'fan inject', fanInject);
  await auditView(page, 'fan-matches', async () => { await injectFan(); });

  // 6) Bracket / playoff container synthetic for mobile stack CSS
  const injectBracket = async () => {
    await page.evaluate(() => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const app = document.getElementById('view-app');
      if (app) app.classList.add('active');
      const lock = document.getElementById('auth-lock');
      if (lock) lock.style.display = 'none';
      let po = document.getElementById('playoff-container');
      if (!po) {
        po = document.createElement('div');
        po.id = 'playoff-container';
        if (app) app.appendChild(po);
      }
      po.innerHTML = '<div class="playoff-bracket">' +
        '<div class="bracket-head bracket-head--qf">ĆF</div><div class="bracket-head bracket-head--sf">PF</div>' +
        '<div class="bracket-head bracket-head--bronze">3.</div><div class="bracket-head bracket-head--final">F</div>' +
        '<div class="bracket-slot bracket-slot--qf1"><div class="bracket-match"><div class="match-po-team">Drużyna Długa Nazwa Alpha</div><div class="match-po-team">Drużyna Długa Nazwa Beta</div></div></div>' +
        '<div class="bracket-slot bracket-slot--final"><div class="bracket-match bm-grand-final"><div class="match-po-team">Alpha</div><div class="match-po-team">Beta</div></div></div>' +
        '</div>';
    });
  };
  await injectBracket();
  await auditView(page, 'playoff-bracket', async () => { await injectBracket(); });

  // 7) Modal Strzelcy + Share (R7)
  const openModals = async (which) => {
    await page.evaluate((w) => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const app = document.getElementById('view-app');
      if (app) app.classList.add('active');
      const lock = document.getElementById('auth-lock');
      if (lock) lock.style.display = 'none';
      document.querySelectorAll('.modal').forEach((m) => { m.style.display = 'none'; });
      const modal = document.getElementById(w);
      if (modal) {
        modal.style.display = 'block';
        const t1 = document.getElementById('mT1');
        const t2 = document.getElementById('mT2');
        if (t1) t1.textContent = 'Klub Sportowy Piłka Nożna Warszawa 2026';
        if (t2) t2.textContent = 'Akademia Młodych Talentów Kraków Południe';
      }
    }, which);
  };
  await openModals('matchModal');
  await auditView(page, 'modal-strzelcy', async () => { await openModals('matchModal'); });
  await openModals('shareModal');
  await auditView(page, 'modal-share', async () => { await openModals('shareModal'); });

} catch (e) {
  await dbg('ERR', 'audit crashed', { error: String(e), stack: e.stack });
  console.error(e);
} finally {
  await browser.close();
  if (appServer) appServer.close();
  if (landServer) landServer.close();
}

// Scores — page overflow CRITICAL only when overflowX>8 on customer P0 or any view
function scoreFor(widths, viewFilter) {
  const relevant = findings.filter((f) => widths.includes(f.width) && (!viewFilter || viewFilter(f.view)));
  const crit = relevant.filter((f) => f.severity === 'CRITICAL').length;
  const high = relevant.filter((f) => f.severity === 'HIGH').length;
  const med = relevant.filter((f) => f.severity === 'MEDIUM').length;
  const low = relevant.filter((f) => f.severity === 'LOW').length;
  let score = 100 - crit * 12 - high * 7 - med * 3 - low * 1;
  return Math.max(0, Math.min(100, score));
}

const isP0 = (v) => /^(landing|login|demo|assistant|playoff|fan)/.test(v);
const uniqueOverflowViews = [...new Set(findings.filter((f) => f.cause.includes('scrollWidth')).map((f) => `${f.view}@${f.width}`))];

const report = {
  generatedAt: new Date().toISOString(),
  cachebustHint: 'v=20260718ux3',
  hypotheses: {
    A: 'Nav desktop/mobile MQ (1366) psuje tablet landscape 1024–1365',
    B: 'tpPreferMatchCards / karty nie działają ≤767 → regresja tabel',
    C: 'live-split od 768 powoduje overflow na wąskich landscape',
    D: 'Autopay nadal min-width / overflow na landing ≤430',
    E: 'Admin container/tabele nadal page-level horizontal scroll',
    F: 'Demo Final/Podium overflow lub clip po zmianach embed/max-height',
    G: 'Modale Strzelcy/Share wychodzą poza viewport na MP (R7)',
    H: 'Safe-area / sticky powoduje clip lub overflow (R8)'
  },
  summary: {
    findingsCount: findings.length,
    bySeverity: {
      CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
      HIGH: findings.filter((f) => f.severity === 'HIGH').length,
      MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
      LOW: findings.filter((f) => f.severity === 'LOW').length
    },
    overflowCases: uniqueOverflowViews.length,
    measurements: measurements.length
  },
  scores: {
    production: scoreFor(ALL_W),
    mobile: scoreFor(MOBILE),
    tablet: scoreFor(TABLET_L),
    desktop: scoreFor(DESKTOP),
    p0Customer: scoreFor(ALL_W, isP0)
  },
  findings,
  sampleMeasurements: measurements.filter((_, i) => i % 7 === 0).slice(0, 40)
};

const out = path.join(__dirname, 'qa-responsive-regression-report.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
await dbg('SUMMARY', 'audit complete', report.summary);
await dbg('SCORES', 'readiness', report.scores);

console.log(JSON.stringify({ summary: report.summary, scores: report.scores, top: findings.slice(0, 15) }, null, 2));
console.log('Wrote', out);
