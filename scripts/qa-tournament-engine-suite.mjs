/**
 * Kompleksowy test silnika turniejowego (logika, nie auth/security).
 * Uruchom: node scripts/qa-tournament-engine-suite.mjs
 * Wymaga: npx playwright (lokalnie), serwer HTTP na porcie 8080 (uruchamiany automatycznie).
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const PORT = Number(process.env.QA_PORT || 8080);
const REPORT_PATH = join(__dir, 'qa-tournament-engine-report.json');

// ── Lokalny serwer statyczny ──
function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      const file = url === '/' ? '/index.html' : url;
      const path = join(ROOT, file.replace(/^\//, ''));
      try {
        const data = readFileSync(path);
        const ext = path.split('.').pop();
        const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', webp: 'image/webp' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

// ── Konfiguracje turniejów: minimalizacja meczów grupowych ──
function groupConfigsForTeams(n) {
  const configs = [];
  const add = (groups, adv, bracket) => configs.push({ teams: n, groups, adv, bracket: bracket || Math.min(8, adv) });

  if (n <= 4) {
    add(1, n, 4);
    return configs;
  }

  // 1 grupa (baseline — każdy z każdym)
  add(1, Math.min(4, n), 4);

  // Optymalne podziały — jak najmniej meczów grupowych
  const divisors = [];
  for (let g = 2; g <= Math.min(n, 12); g++) {
    if (n % g === 0) divisors.push(g);
  }
  for (const g of divisors) {
    const perGroup = n / g;
    if (perGroup >= 2 && perGroup <= 10) {
      const adv = Math.min(n, g * Math.max(1, Math.floor(4 / g)) || g * 2);
      add(g, Math.min(adv, 8), adv <= 4 ? 4 : 8);
    }
  }

  // Specjalne rozmiary z poprzednich testów
  if (n === 27) add(6, 8, 8);
  if (n === 8) add(2, 4, 4);
  if (n === 10) add(2, 4, 4);
  if (n === 16) {
    add(4, 8, 8);
    add(4, 16, 16);
  }

  // Deduplikacja
  const seen = new Set();
  return configs.filter((c) => {
    const k = `${c.groups}-${c.adv}-${c.bracket}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const TEAM_COUNTS = [3, 4, 5, 8, 10, 12, 15, 16, 20, 24, 27, 30, 32, 36, 40];

const EDGE_NAMES = [
  { name: 'ŁÓDŹ & ŚLĄSK "A"', gk: 'ŻÓŁĆ ĄĘ', cap: 'Müller ß' },
  { name: '<script>alert(1)</script>', gk: '<img src=x onerror=1>', cap: '"><svg/onload=alert(1)>' },
  { name: "O'Brien & Sons 'FC'", gk: 'Test\\nNewline', cap: 'Cap\tTab' },
  { name: '🔥⚽ ÉLITE ÑOÑO', gk: '🧤 BRAMKARZ', cap: '©®™' },
  { name: 'NULL\0BYTE', gk: 'DROP TABLE;', cap: '${7*7}' },
  { name: 'A'.repeat(120), gk: 'B'.repeat(80), cap: 'C'.repeat(80) },
  { name: '  SPACJE  ', gk: '  GK  ', cap: '  CAP  ' },
  { name: 'SELECT * FROM teams', gk: '{{constructor}}', cap: 'javascript:void(0)' },
];

const report = {
  startedAt: new Date().toISOString(),
  environment: { port: PORT, engine: 'index.html initAppModule bridge' },
  priorQaScripts: [
    'qa-tournament-27-report.mjs — 27 drużyn / 6 grup, remis absolutny, play-off, podium, archiwum',
    'qa-demo-story-smoke.mjs — Demo Story E0→E7, finał 3:2, podium',
    'qa-demo-final-draw.mjs — remis finału, kary, odrzucenie 4:4 karnych',
    'qa-demo-tables-standings.mjs — tabele demo, awans top-2',
    'qa-demo-tables.mjs, qa-demo-filters.mjs, qa-demo-e2-fan.mjs — UI/fan',
  ],
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  scenarios: [],
  edgeCases: [],
  invariantTests: [],
  hotSpots: [],
  errors: [],
};

function record(cat, name, ok, detail, extra = {}) {
  const entry = { name, ok, detail, ...extra, at: new Date().toISOString() };
  (cat === 'scenario' ? report.scenarios : cat === 'edge' ? report.edgeCases : report.invariantTests).push(entry);
  report.summary.total++;
  if (ok) report.summary.passed++;
  else report.summary.failed++;
  if (extra.warning) report.summary.warnings++;
  const icon = ok ? (extra.warning ? '⚠' : '✓') : '✗';
  console.log(`${icon} [${cat}] ${name}: ${detail}`);
}

// ── Logika testów w przeglądarce (prawdziwy silnik z index.html) ──
const BROWSER_TEST_FN = () => {
  window.__qaConfirm = () => true;
  window.confirm = () => true;

  function resetState() {
    window.applyDemoScenarioState({
      teams: [], groups: {}, matches: [], playoffs: [], settings: {}, logs: [],
    });
  }

    function expectedGroupMatches(groups) {
      let total = 0;
      Object.values(groups).forEach((teams) => {
        const n = teams.length;
        // Berger z PAUZA: każda drużyna gra n-1 meczów → n*(n-1)/2
        total += (n * (n - 1)) / 2;
      });
      return total;
    }

  function buildTeams(n, nameFn) {
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      name: nameFn(i, 'name'),
      gk: nameFn(i, 'gk'),
      cap: nameFn(i, 'cap'),
    }));
  }

  function distributeGroups(teams, nG) {
    const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, nG);
    const groups = {};
    names.forEach((g) => { groups[g] = []; });
    teams.forEach((t, i) => groups[names[i % nG]].push({ ...t }));
    return groups;
  }

  function generateSchedule(groups, settings) {
    const pool = [];
    Object.keys(groups).forEach((gn) => {
      let teams = groups[gn].map((t) => ({ ...t }));
      if (teams.length % 2 !== 0) teams.push({ id: -1, name: 'PAUZA' });
      const n = teams.length;
      for (let round = 0; round < n - 1; round++) {
        for (let i = 0; i < n / 2; i++) {
          const t1 = teams[i];
          const t2 = teams[n - 1 - i];
          if (t1.id !== -1 && t2.id !== -1) {
            pool.push({ group: gn, t1: { ...t1 }, t2: { ...t2 }, g1: 0, g2: 0, played: false, s1: [], s2: [] });
          }
        }
        teams.splice(1, 0, teams.pop());
      }
    });
    let curr = settings.start || '09:00';
    return pool.map((m, idx) => {
      const match = { ...m, id: idx + 1, time: curr };
      curr = window.addMin(curr, (settings.gDur || 10) + (settings.gBreak || 2));
      return match;
    });
  }

  function seededScore(seed, max = 5) {
    const x = Math.sin(seed * 127.1) * 10000;
    return Math.abs(Math.floor((x - Math.floor(x)) * (max + 1)));
  }

  function playAllGroupMatches(matches, teams, seed = 1) {
    let i = 0;
    matches.forEach((m) => {
      const g1 = seededScore(seed + i, 4);
      const g2 = seededScore(seed + i + 50, 4);
      m.g1 = g1;
      m.g2 = g2;
      m.played = true;
      const cap1 = teams.find((t) => t.id === m.t1.id)?.cap || 'STRZEL';
      const cap2 = teams.find((t) => t.id === m.t2.id)?.cap || 'STRZEL';
      m.s1 = Array.from({ length: g1 }, () => ({ name: cap1 }));
      m.s2 = Array.from({ length: g2 }, () => ({ name: cap2 }));
      i++;
    });
  }

  function verifyStandings(groups, matches) {
    const issues = [];
    Object.keys(groups).forEach((gn) => {
      const st = window.getSortedGroupStats(gn);
      const groupMatches = matches.filter((m) => m.group === gn && m.played);
      let totalPts = 0;
      let totalWins = 0;
      let totalDraws = 0;
      st.forEach((s) => {
        totalPts += s.pkt;
        totalWins += s.w;
        totalDraws += s.r;
        if (s.m !== s.w + s.r + s.p) issues.push(`${gn}: M≠W+R+P dla ${s.t.name}`);
        if (s.bz - s.bs !== s.bz - s.bs) issues.push(`${gn}: bilans`);
      });
      let expectedPts = 0;
      groupMatches.forEach((m) => {
        if (m.g1 > m.g2) expectedPts += 3;
        else if (m.g2 > m.g1) expectedPts += 3;
        else expectedPts += 2;
      });
      if (totalPts !== expectedPts) issues.push(`${gn}: suma pkt ${totalPts} ≠ ${expectedPts}`);
      const totalGoals = groupMatches.reduce((a, m) => a + m.g1 + m.g2, 0);
      const tableGoals = st.reduce((a, s) => a + s.bz, 0);
      if (totalGoals !== tableGoals) issues.push(`${gn}: bramki ${tableGoals} ≠ ${totalGoals}`);
    });
    return issues;
  }

  function resolvePlayoffs(playoffs, seed = 0) {
    const order = [...playoffs].sort((a, b) => (a.id || 0) - (b.id || 0));
    order.forEach((m, idx) => {
      if (m.played) return;
      if (m.t1?.name === '?' || m.t2?.name === '?' || !m.t1?.name || !m.t2?.name) return;
      if (m.t1?.id === -99 || m.t2?.id === -99) return;
      let g1 = seededScore(seed + idx, 3);
      let g2 = seededScore(seed + idx + 7, 3);
      if (g1 === g2) { g1 = 1; g2 = 1; m.pen1 = 5; m.pen2 = 4; }
      else { m.pen1 = null; m.pen2 = null; }
      m.g1 = g1; m.g2 = g2; m.played = true;
      m.s1 = g1 ? [{ name: (m.t1.cap || 'A').toString() }] : [];
      m.s2 = g2 ? [{ name: (m.t2.cap || 'B').toString() }] : [];
      const getW = (x) => x.g1 > x.g2 ? x.t1 : (x.g1 < x.g2 ? x.t2 : (x.pen1 > x.pen2 ? x.t1 : x.t2));
      const getL = (x) => x.g1 > x.g2 ? x.t2 : (x.g1 < x.g2 ? x.t1 : (x.pen1 > x.pen2 ? x.t2 : x.t1));
      const w = getW(m); const l = getL(m);
      if (m.next) { const nm = playoffs.find((x) => x.id === m.next); if (nm) nm[m.slot] = w; }
      if (m.loserNext) {
        const slot = m.loserSlot || m.slotLoser || 't2';
        const nlm = playoffs.find((x) => x.id === m.loserNext);
        if (nlm) nlm[slot] = l;
      }
    });
  }

  function runScenario(cfg, teamNames) {
    resetState();
    const settings = {
      bracketSize: cfg.bracket,
      advCount: cfg.adv,
      start: '09:00',
      gDur: 10,
      gBreak: 2,
      afterG: 10,
      poDur: 12,
      finDur: 15,
    };
    const teams = buildTeams(cfg.teams, (i, field) => {
      if (teamNames && teamNames[i]) return teamNames[i][field] || `T${i + 1}`;
      return field === 'name' ? `DRUZYNA ${i + 1}` : field === 'gk' ? `BRAMKARZ ${i + 1}` : `KAPITAN ${i + 1}`;
    });
    const groups = distributeGroups(teams, cfg.groups);
    const matches = generateSchedule(groups, settings);
    const expectedMatches = expectedGroupMatches(groups);

    window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings, logs: [] });

    if (matches.length !== expectedMatches) {
      return { ok: false, error: `Mecze: ${matches.length} ≠ ${expectedMatches}` };
    }

    playAllGroupMatches(matches, teams, cfg.teams * cfg.groups);
    const standingIssues = verifyStandings(groups, matches);
    if (standingIssues.length) return { ok: false, error: standingIssues.join('; ') };

    const adv = window.getAdvancingTeamsFull();
    if (adv.length !== Math.min(cfg.adv, cfg.teams)) {
      return { ok: false, error: `Awans: ${adv.length} ≠ ${Math.min(cfg.adv, cfg.teams)}` };
    }

    // Play-off tylko gdy awans < drużyn lub bracket wymagany
    let playoffOk = true;
    let podium = null;
    if (cfg.adv >= 2 && cfg.teams > 3) {
      window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings, logs: [] });
      window.generujPlayoff();
      const po = [...(JSON.parse(JSON.stringify(window.__qaGetState?.() || {})).playoffs || [])];
      // Re-apply played matches then resolve playoffs via engine state
      playAllGroupMatches(matches, teams, cfg.teams * cfg.groups + 1);
      window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings, logs: [] });
      window.generujPlayoff();
      resolvePlayoffs(window.__qaGetState().playoffs, cfg.teams);
      const st = window.__qaGetState();
      window.applyDemoScenarioState(st);

      const fin = window.findGrandFinalMatch();
      const m3 = (st.playoffs || []).find((m) => (m.n || '').includes('3. MIEJSCE'));
      if (!fin || !window.isMatchDecided(fin)) {
        playoffOk = false;
      } else {
        const stats = window.calcStats();
        const getW = (m) => m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2));
        podium = {
          gold: getW(fin).name,
          silver: fin.g1 > fin.g2 ? fin.t2.name : fin.t1.name,
          bronze: m3?.played ? getW(m3).name : '—',
          topScorer: stats.scorer?.[0] || null,
          topGk: stats.gk?.n || null,
        };
      }
    }

    const archivePayload = {
      teams, groups, matches, playoffs: window.__qaGetState().playoffs || [],
      settings, logs: ['QA'],
      _meta_name: 'QA TEST',
      _meta_date: new Date().toLocaleString('pl-PL'),
      _license_owner: 'QA-KEY',
    };
    const archiveValid = archivePayload.teams.length === cfg.teams
      && archivePayload.matches.every((m) => m.played)
      && archivePayload._meta_name;

    return {
      ok: standingIssues.length === 0 && playoffOk && archiveValid,
      teams: cfg.teams,
      groups: cfg.groups,
      groupMatches: matches.length,
      adv: adv.map((t) => t.name),
      playoffCount: (window.__qaGetState().playoffs || []).length,
      podium,
      archiveValid,
      playoffOk,
    };
  }

  function testSyncTeamData() {
    resetState();
    const teams = [{ id: 0, name: 'ALPHA', gk: 'GK1', cap: 'C1' }, { id: 1, name: 'BETA', gk: 'GK2', cap: 'C2' }];
    const groups = { A: [{ ...teams[0] }, { ...teams[1] }] };
    const matches = [{
      id: 1, group: 'A', t1: { ...teams[0] }, t2: { ...teams[1] },
      g1: 0, g2: 0, played: false, s1: [], s2: [],
    }];
    window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings: {}, logs: [] });
    window.syncTeamData(0, 'name', '  nowa nazwa <test>  ');
    const st = window.__qaGetState();
    const renamed = st.teams[0].name;
    const inGroup = st.groups.A[0].name;
    const inMatch = st.matches[0].t1.name;
    return {
      ok: renamed === 'NOWA NAZWA <TEST>' && inGroup === renamed && inMatch === renamed,
      renamed, inGroup, inMatch,
    };
  }

  function testRenderInputsXss() {
    resetState();
    const evil = '<img src=x onerror=alert(1)>';
    window.applyDemoScenarioState({
      teams: [{ id: 0, name: evil, gk: evil, cap: evil }],
      groups: {}, matches: [], playoffs: [], settings: {}, logs: [],
    });
    window.renderInputs();
    const html = document.getElementById('inputs-container')?.innerHTML || '';
    const hasRawTag = html.includes('<img') && !html.includes('&lt;img');
    return { ok: !hasRawTag, htmlSnippet: html.slice(0, 200) };
  }

  function testAbsoluteTie() {
    resetState();
    const teams = [
      { id: 0, name: 'A', gk: 'G1', cap: 'C1' },
      { id: 1, name: 'B', gk: 'G2', cap: 'C2' },
      { id: 2, name: 'C', gk: 'G3', cap: 'C3' },
      { id: 3, name: 'D', gk: 'G4', cap: 'C4' },
    ];
    const groups = { A: teams.map((t) => ({ ...t })) };
    const settings = { advCount: 2, bracketSize: 4 };
    const matches = generateSchedule(groups, { start: '10:00', gDur: 10, gBreak: 2 });
    // Remis absolutny A vs B
    const set = (i, j, g1, g2) => {
      const m = matches.find((x) => (x.t1.id === i && x.t2.id === j) || (x.t1.id === j && x.t2.id === i));
      if (m) { m.g1 = g1; m.g2 = g2; m.played = true; }
    };
    set(0, 1, 1, 1); set(2, 3, 0, 0); set(0, 2, 2, 0); set(0, 3, 2, 0);
    set(1, 2, 2, 0); set(1, 3, 2, 0);
    window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings, logs: [] });
    const st = window.getSortedGroupStats('A');
    const abs = window.isAbsoluteRemis(st[0], st[1]);
    return { ok: abs, top2: st.slice(0, 2).map((s) => ({ name: s.t.name, pkt: s.pkt })) };
  }

  function testH2HTiebreak() {
    resetState();
    const teams = [
      { id: 0, name: 'X', gk: 'G1', cap: 'C1' },
      { id: 1, name: 'Y', gk: 'G2', cap: 'C2' },
      { id: 2, name: 'Z', gk: 'G3', cap: 'C3' },
    ];
    const groups = { A: teams.map((t) => ({ ...t })) };
    const matches = generateSchedule(groups, { start: '10:00', gDur: 10, gBreak: 2 });
    const set = (i, j, g1, g2) => {
      const m = matches.find((x) => (x.t1.id === i && x.t2.id === j) || (x.t1.id === j && x.t2.id === i));
      if (m) { m.g1 = g1; m.g2 = g2; m.played = true; }
    };
    set(0, 1, 1, 0); set(0, 2, 0, 1); set(1, 2, 0, 1); // X i Y po 3 pkt, Y wygrywa bezpośrednio z X
    window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings: { advCount: 2 }, logs: [] });
    const st = window.getSortedGroupStats('A');
    return { ok: st[0].t.name === 'Y' && st[1].t.name === 'X', order: st.map((s) => s.t.name) };
  }

  function testPodiumBlockedOnDraw() {
    resetState();
    const fin = { id: 402, n: 'WIELKI FINAŁ', t1: { id: 0, name: 'A' }, t2: { id: 1, name: 'B' }, g1: 1, g2: 1, played: true, pen1: null, pen2: null, s1: [], s2: [] };
    window.applyDemoScenarioState({ teams: [], groups: {}, matches: [], playoffs: [fin], settings: {}, logs: [] });
    const decided = window.isMatchDecided(fin);
    return { ok: !decided, decided };
  }

  function testOddTeamBye() {
    resetState();
    const teams = buildTeams(3, (i, f) => (f === 'name' ? `T${i}` : f));
    const groups = { A: teams.map((t) => ({ ...t })) };
    const matches = generateSchedule(groups, { start: '09:00', gDur: 10, gBreak: 2 });
    const pauseMatches = matches.filter((m) => m.t1.name === 'PAUZA' || m.t2.name === 'PAUZA');
    return { ok: matches.length === 3 && pauseMatches.length === 0, count: matches.length };
  }

  return {
    runScenario,
    testSyncTeamData,
    testRenderInputsXss,
    testAbsoluteTie,
    testH2HTiebreak,
    testPodiumBlockedOnDraw,
    testOddTeamBye,
    EDGE_NAMES,
  };
};

let server;
let browser;

try {
  server = await startServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.applyDemoScenarioState === 'function', { timeout: 30000 });

  // Getter stanu (closure) przez apply + odczyt z render
  await page.evaluate(() => {
    let _qaState = null;
    const orig = window.applyDemoScenarioState;
    window.applyDemoScenarioState = function (data) {
      _qaState = JSON.parse(JSON.stringify(data));
      return orig(data);
    };
    window.__qaGetState = () => {
      // Odczyt aktualnego stanu przez symulację odczytu funkcji silnika
      const teams = [];
      const probe = (fn) => { try { return fn(); } catch { return null; } };
      // Hack: serializuj przez funkcje — teams z getSortedGroupStats jeśli grupy istnieją
      const out = { teams: [], groups: {}, matches: [], playoffs: [], settings: {}, logs: [] };
      const gk = Object.keys(window.__qaLastGroups || {});
      // Bezpośredni dostęp niemożliwy — przechowuj mirror
      return window.__qaMirror || _qaState || out;
    };
    window.__qaMirror = null;
    const origApply = window.applyDemoScenarioState;
    window.applyDemoScenarioState = function (d) {
      window.__qaMirror = JSON.parse(JSON.stringify(d));
      if (d.matches) window.__qaMirror.matches = d.matches;
      if (d.playoffs) window.__qaMirror.playoffs = d.playoffs;
      return origApply(d);
    };
    // Patch generujPlayoff to capture playoffs
    const origPo = window.generujPlayoff;
    window.generujPlayoff = function () {
      origPo.call(window);
      // Mirror updated via save — read from playoff functions
      setTimeout(() => {}, 0);
    };
  });

  // Lepszy mirror — hook saveMatch i generujPlayoff
  await page.evaluate(() => {
    window.__qaMirror = { teams: [], groups: {}, matches: [], playoffs: [], settings: {}, logs: [] };
    const syncMirror = () => {
      const adv = window.getAdvancingTeamsFull?.() || [];
      void adv;
    };
    const origApply = window.applyDemoScenarioState;
    window.applyDemoScenarioState = function (data) {
      window.__qaMirror = JSON.parse(JSON.stringify(data));
      return origApply(data);
    };
    window.__qaGetState = () => window.__qaMirror;
    const origGenPo = window.generujPlayoff;
    window.generujPlayoff = function () {
      origGenPo.call(this);
      // playoffs written to closure — odczytaj przez findGrandFinal
      const fin = window.findGrandFinalMatch?.();
      if (fin) {
        // Pobierz playoffs przez render — użyj hack: tymczasowy kontener
        const po = [];
        const ids = [101, 102, 103, 104, 105, 106, 107, 108, 201, 202, 203, 204, 301, 302, 401, 402];
        // Nie mamy dostępu — zapisz po wywołaniu przez ponowne apply z openMatch flow
      }
    };
  });

  // Najprostsze rozwiązanie: pełna logika testów w jednym evaluate
  const runAllInBrowser = await page.evaluate(async (configs) => {
    window.confirm = () => true;
    window.alert = () => {};

    let mirror = { teams: [], groups: {}, matches: [], playoffs: [], settings: {}, logs: [] };
    const origApply = window.applyDemoScenarioState;
    window.applyDemoScenarioState = function (data) {
      mirror = JSON.parse(JSON.stringify(data));
      return origApply(data);
    };
    window.__qaGetState = () => mirror;
    window.__qaUpdateMirror = (patch) => { mirror = { ...mirror, ...patch }; };

    // Hook generujPlayoff — po wywołaniu playoffs są w closure, nie w mirror
    // Rozwiązanie: odtwórz playoffs przez openMatch chain — zamiast tego kopiuj z saveMatch
    const origSave = window.saveMatch;
    // saveMatch wymaga modala — nie używamy

    function resetState() {
      window.applyDemoScenarioState({ teams: [], groups: {}, matches: [], playoffs: [], settings: {}, logs: [] });
    }

    function expectedGroupMatches(groups) {
      let total = 0;
      Object.values(groups).forEach((teams) => {
        const n = teams.length;
        total += (n * (n - 1)) / 2;
      });
      return total;
    }

    function setById(matches, id1, id2, g1, g2) {
      const mx = matches.find((x) => (x.t1.id === id1 && x.t2.id === id2) || (x.t1.id === id2 && x.t2.id === id1));
      if (!mx) return false;
      if (mx.t1.id === id1) { mx.g1 = g1; mx.g2 = g2; }
      else { mx.g1 = g2; mx.g2 = g1; }
      mx.played = true;
      return true;
    }

    function buildTeams(n, nameFn) {
      return Array.from({ length: n }, (_, i) => ({
        id: i,
        name: nameFn(i, 'name'),
        gk: nameFn(i, 'gk'),
        cap: nameFn(i, 'cap'),
      }));
    }

    function distributeGroups(teams, nG) {
      const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, nG);
      const groups = {};
      names.forEach((g) => { groups[g] = []; });
      teams.forEach((t, i) => groups[names[i % nG]].push({ ...t }));
      return groups;
    }

    function generateSchedule(groups, settings) {
      const pool = [];
      Object.keys(groups).forEach((gn) => {
        let teams = groups[gn].map((t) => ({ ...t }));
        if (teams.length % 2 !== 0) teams.push({ id: -1, name: 'PAUZA' });
        const n = teams.length;
        for (let round = 0; round < n - 1; round++) {
          for (let i = 0; i < n / 2; i++) {
            const t1 = teams[i];
            const t2 = teams[n - 1 - i];
            if (t1.id !== -1 && t2.id !== -1) {
              pool.push({ group: gn, t1: { ...t1 }, t2: { ...t2 }, g1: 0, g2: 0, played: false, s1: [], s2: [] });
            }
          }
          teams.splice(1, 0, teams.pop());
        }
      });
      let curr = settings.start || '09:00';
      return pool.map((m, idx) => {
        const match = { ...m, id: idx + 1, time: curr };
        curr = window.addMin(curr, (settings.gDur || 10) + (settings.gBreak || 2));
        return match;
      });
    }

    function seededScore(seed, max = 5) {
      const x = Math.sin(seed * 127.1) * 10000;
      return Math.abs(Math.floor((x - Math.floor(x)) * (max + 1)));
    }

    function playAllGroupMatches(matches, teams, seed = 1) {
      let i = 0;
      matches.forEach((m) => {
        const g1 = seededScore(seed + i, 4);
        const g2 = seededScore(seed + i + 50, 4);
        m.g1 = g1;
        m.g2 = g2;
        m.played = true;
        const cap1 = teams.find((t) => t.id === m.t1.id)?.cap || 'STRZEL';
        const cap2 = teams.find((t) => t.id === m.t2.id)?.cap || 'STRZEL';
        m.s1 = Array.from({ length: g1 }, () => ({ name: cap1 }));
        m.s2 = Array.from({ length: g2 }, () => ({ name: cap2 }));
        i++;
      });
    }

    function verifyStandings(groups, matches) {
      const issues = [];
      Object.keys(groups).forEach((gn) => {
        const st = window.getSortedGroupStats(gn);
        const groupMatches = matches.filter((m) => m.group === gn && m.played);
        let totalPts = 0;
        st.forEach((s) => {
          totalPts += s.pkt;
          if (s.m !== s.w + s.r + s.p) issues.push(`${gn}: M≠W+R+P dla ${s.t.name}`);
        });
        let expectedPts = 0;
        groupMatches.forEach((m) => {
          if (m.g1 > m.g2) expectedPts += 3;
          else if (m.g2 > m.g1) expectedPts += 3;
          else expectedPts += 2;
        });
        if (totalPts !== expectedPts) issues.push(`${gn}: suma pkt ${totalPts} ≠ ${expectedPts}`);
        const totalGoals = groupMatches.reduce((a, m) => a + m.g1 + m.g2, 0);
        const tableGoals = st.reduce((a, s) => a + s.bz, 0);
        if (totalGoals !== tableGoals) issues.push(`${gn}: bramki ${tableGoals} ≠ ${totalGoals}`);
      });
      return issues;
    }

    function buildPlayoffBracket(pool, settings, lastMatchTime) {
      let bSize = settings.bracketSize || 8;
      if (pool.length <= 4) bSize = 4;
      const p = [...pool];
      while (p.length < bSize) p.push({ id: -99, name: '— WOLNY LOS —', gk: '-', cap: '-' });
      let curr = window.addMin(lastMatchTime, settings.afterG || 10);
      const playoffs = [];
      const poDur = parseInt(settings.poDur, 10) || 12;

      if (bSize === 16) {
        playoffs.push(
          { id: 101, n: '1/8 Finału - 1', time: curr, t1: p[0], t2: p[15], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 201, slot: 't1' },
          { id: 102, n: '1/8 Finału - 2', time: curr, t1: p[7], t2: p[8], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 201, slot: 't2' },
          { id: 103, n: '1/8 Finału - 3', time: window.addMin(curr, poDur + 2), t1: p[3], t2: p[12], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 202, slot: 't1' },
          { id: 104, n: '1/8 Finału - 4', time: window.addMin(curr, poDur + 2), t1: p[4], t2: p[11], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 202, slot: 't2' },
          { id: 105, n: '1/8 Finału - 5', time: window.addMin(curr, (poDur + 2) * 2), t1: p[1], t2: p[14], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 203, slot: 't1' },
          { id: 106, n: '1/8 Finału - 6', time: window.addMin(curr, (poDur + 2) * 2), t1: p[6], t2: p[9], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 203, slot: 't2' },
          { id: 107, n: '1/8 Finału - 7', time: window.addMin(curr, (poDur + 2) * 3), t1: p[2], t2: p[13], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 204, slot: 't1' },
          { id: 108, n: '1/8 Finału - 8', time: window.addMin(curr, (poDur + 2) * 3), t1: p[5], t2: p[10], g1: 0, g2: 0, played: false, s1: [], s2: [], next: 204, slot: 't2' },
        );
        curr = window.addMin(curr, (poDur + 2) * 4 + 5);
      }

      if (bSize >= 8) {
        const qfT1_1 = bSize === 8 ? p[0] : { name: '?' };
        const qfT2_1 = bSize === 8 ? p[7] : { name: '?' };
        const qfT1_2 = bSize === 8 ? p[3] : { name: '?' };
        const qfT2_2 = bSize === 8 ? p[4] : { name: '?' };
        const qfT1_3 = bSize === 8 ? p[1] : { name: '?' };
        const qfT2_3 = bSize === 8 ? p[6] : { name: '?' };
        const qfT1_4 = bSize === 8 ? p[2] : { name: '?' };
        const qfT2_4 = bSize === 8 ? p[5] : { name: '?' };
        playoffs.push(
          { id: 201, n: 'Ćwierćfinał 1', time: curr, t1: qfT1_1, t2: qfT2_1, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 301, slot: 't1' },
          { id: 202, n: 'Ćwierćfinał 2', time: curr, t1: qfT1_2, t2: qfT2_2, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 301, slot: 't2' },
          { id: 203, n: 'Ćwierćfinał 3', time: window.addMin(curr, poDur + 2), t1: qfT1_3, t2: qfT2_3, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 302, slot: 't1' },
          { id: 204, n: 'Ćwierćfinał 4', time: window.addMin(curr, poDur + 2), t1: qfT1_4, t2: qfT2_4, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 302, slot: 't2' },
        );
        curr = window.addMin(window.addMin(curr, poDur + 2), poDur + 5);
      }
      const sfT1_1 = bSize === 4 ? p[0] : { name: '?' };
      const sfT2_1 = bSize === 4 ? p[3] : { name: '?' };
      const sfT1_2 = bSize === 4 ? p[1] : { name: '?' };
      const sfT2_2 = bSize === 4 ? p[2] : { name: '?' };
      playoffs.push(
        { id: 301, n: 'Półfinał 1', time: curr, t1: sfT1_1, t2: sfT2_1, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 402, slot: 't1', loserNext: 401, loserSlot: 't1' },
        { id: 302, n: 'Półfinał 2', time: window.addMin(curr, 14), t1: sfT1_2, t2: sfT2_2, g1: 0, g2: 0, played: false, s1: [], s2: [], next: 402, slot: 't2', loserNext: 401, loserSlot: 't2' },
      );
      playoffs.push(
        { id: 401, n: 'MECZ O 3. MIEJSCE', time: window.addMin(curr, 19), t1: { name: '?' }, t2: { name: '?' }, g1: 0, g2: 0, played: false, s1: [], s2: [] },
        { id: 402, n: 'WIELKI FINAŁ', time: window.addMin(curr, 34), t1: { name: '?' }, t2: { name: '?' }, g1: 0, g2: 0, played: false, s1: [], s2: [] },
      );
      playoffs.forEach((m) => {
        if (m.t1.id === -99 || m.t2.id === -99) {
          m.played = true;
          if (m.t1.id === -99) { m.g1 = 0; m.g2 = 3; } else { m.g1 = 3; m.g2 = 0; }
          const getW = (x) => (x.g1 > x.g2 ? x.t1 : x.t2);
          const w = getW(m);
          if (m.next) { const nm = playoffs.find((x) => x.id === m.next); if (nm) nm[m.slot] = w; }
        }
      });
      return playoffs;
    }

    function resolvePlayoffs(playoffs, seed = 0) {
      const order = [...playoffs].sort((a, b) => (a.id || 0) - (b.id || 0));
      for (let pass = 0; pass < 8; pass++) {
        order.forEach((m, idx) => {
          if (m.played) return;
          if (!m.t1?.name || !m.t2?.name || m.t1.name === '?' || m.t2.name === '?') return;
          if (m.t1.id === -99 || m.t2.id === -99) return;
          let g1 = seededScore(seed + idx + pass, 3);
          let g2 = seededScore(seed + idx + pass + 7, 3);
          if (g1 === g2) { g1 = 1; g2 = 1; m.pen1 = 5; m.pen2 = 4; }
          else { m.pen1 = null; m.pen2 = null; }
          m.g1 = g1; m.g2 = g2; m.played = true;
          m.s1 = g1 ? [{ name: (m.t1.cap || 'A').toString() }] : [];
          m.s2 = g2 ? [{ name: (m.t2.cap || 'B').toString() }] : [];
          const getW = (x) => x.g1 > x.g2 ? x.t1 : (x.g1 < x.g2 ? x.t2 : (x.pen1 > x.pen2 ? x.t1 : x.t2));
          const getL = (x) => x.g1 > x.g2 ? x.t2 : (x.g1 < x.g2 ? x.t1 : (x.pen1 > x.pen2 ? x.t2 : x.t1));
          const w = getW(m); const l = getL(m);
          if (m.next) { const nm = playoffs.find((x) => x.id === m.next); if (nm) nm[m.slot] = w; }
          if (m.loserNext) {
            const slot = m.loserSlot || 't2';
            const nlm = playoffs.find((x) => x.id === m.loserNext);
            if (nlm) nlm[slot] = l;
          }
        });
      }
    }

    function runScenario(cfg, teamNames) {
      resetState();
      const settings = {
        bracketSize: cfg.bracket,
        advCount: cfg.adv,
        start: '09:00',
        gDur: 10,
        gBreak: 2,
        afterG: 10,
        poDur: 12,
        finDur: 15,
      };
      const teams = buildTeams(cfg.teams, (i, field) => {
        if (teamNames && teamNames[i]) return teamNames[i][field] || `T${i + 1}`;
        return field === 'name' ? `DRUZYNA ${i + 1}` : field === 'gk' ? `BRAMKARZ ${i + 1}` : `KAPITAN ${i + 1}`;
      });
      const groups = distributeGroups(teams, cfg.groups);
      const matches = generateSchedule(groups, settings);
      const expectedMatches = expectedGroupMatches(groups);
      if (matches.length !== expectedMatches) {
        return { ok: false, error: `Mecze: ${matches.length} ≠ ${expectedMatches}`, cfg };
      }
      playAllGroupMatches(matches, teams, cfg.teams * cfg.groups + 17);
      window.applyDemoScenarioState({ teams, groups, matches, playoffs: [], settings, logs: [] });
      const standingIssues = verifyStandings(groups, matches);
      if (standingIssues.length) return { ok: false, error: standingIssues.join('; '), cfg };
      const adv = window.getAdvancingTeamsFull();
      const expectedAdv = Math.min(cfg.adv, cfg.teams);
      if (adv.length !== expectedAdv) {
        return { ok: false, error: `Awans: ${adv.length} ≠ ${expectedAdv}`, cfg };
      }
      let podium = null;
      let playoffCount = 0;
      if (cfg.adv >= 2 && cfg.teams >= 3) {
        const pool = adv;
        const playoffs = buildPlayoffBracket(pool, settings, matches[matches.length - 1].time);
        playoffCount = playoffs.length;
        window.applyDemoScenarioState({ teams, groups, matches, playoffs, settings, logs: [] });
        resolvePlayoffs(playoffs, cfg.teams);
        window.applyDemoScenarioState({ teams, groups, matches, playoffs, settings, logs: [] });
        const fin = window.findGrandFinalMatch();
        if (!fin || !window.isMatchDecided(fin)) {
          return { ok: false, error: 'Finał nierozstrzygnięty', cfg, fin: fin ? { g1: fin.g1, g2: fin.g2, pen1: fin.pen1, pen2: fin.pen2 } : null };
        }
        const stats = window.calcStats();
        const getW = (m) => m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2));
        const getL = (m) => m.g1 > m.g2 ? m.t2 : (m.g1 < m.g2 ? m.t1 : (m.pen1 > m.pen2 ? m.t2 : m.t1));
        const m3 = playoffs.find((m) => (m.n || '').includes('3. MIEJSCE'));
        podium = {
          gold: getW(fin).name,
          silver: getL(fin).name,
          bronze: m3?.played && window.isMatchDecided(m3) ? getW(m3).name : '—',
          topScorer: stats.scorer?.[0] || null,
          topGk: stats.gk ? `${stats.gk.n} (${stats.gk.t})` : null,
        };
      }
      const archiveValid = teams.length === cfg.teams && matches.every((m) => m.played);
      return {
        ok: archiveValid,
        cfg,
        groupMatches: matches.length,
        adv: adv.map((t) => t.name),
        playoffCount,
        podium,
        archiveValid,
      };
    }

    const EDGE_NAMES = [
      { name: 'ŁÓDŹ & ŚLĄSK "A"', gk: 'ŻÓŁĆ ĄĘ', cap: 'Müller ß' },
      { name: '<script>alert(1)</script>', gk: '<img src=x onerror=1>', cap: '"><svg/onload=alert(1)>' },
      { name: "O'Brien & Sons 'FC'", gk: 'Test\\nNewline', cap: 'Cap\tTab' },
      { name: '🔥⚽ ÉLITE ÑOÑO', gk: '🧤 BRAMKARZ', cap: '©®™' },
      { name: 'NULL\0BYTE', gk: 'DROP TABLE;', cap: '${7*7}' },
      { name: 'A'.repeat(120), gk: 'B'.repeat(80), cap: 'C'.repeat(80) },
      { name: '  SPACJE  ', gk: '  GK  ', cap: '  CAP  ' },
      { name: 'SELECT * FROM teams', gk: '{{constructor}}', cap: 'javascript:void(0)' },
    ];

    const results = { scenarios: [], invariants: [], edge: [] };

    for (const cfg of configs) {
      const r = runScenario(cfg);
      results.scenarios.push(r);
    }

    // Edge: 8 drużyn z niebezpiecznymi nazwami
    const edgeTeams = EDGE_NAMES.map((e, i) => ({ ...e, id: i }));
    const edgeCfg = { teams: 8, groups: 1, adv: 4, bracket: 4 };
    const edgeResult = runScenario(edgeCfg, EDGE_NAMES);
    results.edge.push({ name: 'edge-names-8-single-group', ...edgeResult });

    // syncTeamData — propagacja do grup, meczów (odczyt z silnika, nie mirror)
    resetState();
    const t2 = [{ id: 0, name: 'ALPHA', gk: 'GK1', cap: 'C1' }, { id: 1, name: 'BETA', gk: 'GK2', cap: 'C2' }];
    const g2 = { A: [{ ...t2[0] }, { ...t2[1] }] };
    const m2 = [{ id: 1, group: 'A', t1: { ...t2[0] }, t2: { ...t2[1] }, g1: 0, g2: 0, played: false, s1: [], s2: [] }];
    window.applyDemoScenarioState({ teams: t2, groups: g2, matches: m2, playoffs: [], settings: {}, logs: [] });
    window.syncTeamData(0, 'name', '  nowa nazwa <test>  ');
    window.syncTeamData(0, 'gk', '  bramkarz żółć  ');
    window.syncTeamData(0, 'cap', '  kapitan & syn  ');
    window.renderInputs();
    const stAfterSync = window.getSortedGroupStats('A');
    const inputVal = document.querySelector('#inputs-container input')?.value || '';
    results.invariants.push({
      name: 'syncTeamData-propagation',
      ok: stAfterSync.some((s) => s.t.name === 'NOWA NAZWA <TEST>') && inputVal === 'NOWA NAZWA <TEST>',
      standings: stAfterSync.map((s) => s.t.name),
      inputVal,
    });

    // XSS renderInputs — wymaga aktywnego kontenera
    resetState();
    document.getElementById('view-app')?.classList.add('active');
    window.applyDemoScenarioState({
      teams: [{ id: 0, name: '<img src=x onerror=alert(1)>', gk: 'GK', cap: 'CAP' }],
      groups: {}, matches: [], playoffs: [], settings: {}, logs: [],
    });
    window.renderInputs();
    const html = document.getElementById('inputs-container')?.innerHTML || '';
    const inputEl = document.querySelector('#inputs-container input[type="text"]');
    const val = inputEl?.value || '';
    const imgLeak = document.querySelector('#inputs-container img');
    results.invariants.push({
      name: 'renderInputs-xss-escape',
      ok: val === '<img src=x onerror=alert(1)>' && !imgLeak,
      value: val,
      hasImgElement: !!imgLeak,
      note: 'Brak wycieku <img> do DOM — wartość w atrybucie value (bezpieczne)',
    });

    // Absolute tie
    resetState();
    const t4 = [
      { id: 0, name: 'A', gk: 'G1', cap: 'C1' },
      { id: 1, name: 'B', gk: 'G2', cap: 'C2' },
      { id: 2, name: 'C', gk: 'G3', cap: 'C3' },
      { id: 3, name: 'D', gk: 'G4', cap: 'C4' },
    ];
    const g4 = { A: t4.map((t) => ({ ...t })) };
    const m4 = generateSchedule(g4, { start: '10:00', gDur: 10, gBreak: 2 });
    const allSet = [
      setById(m4, 0, 1, 1, 1), setById(m4, 2, 3, 0, 0), setById(m4, 0, 2, 2, 0),
      setById(m4, 0, 3, 2, 0), setById(m4, 1, 2, 2, 0), setById(m4, 1, 3, 2, 0),
    ];
    window.applyDemoScenarioState({ teams: t4, groups: g4, matches: m4, playoffs: [], settings: { advCount: 2 }, logs: [] });
    const st4 = window.getSortedGroupStats('A');
    results.invariants.push({
      name: 'absolute-tie-detection',
      ok: allSet.every(Boolean) && window.isAbsoluteRemis(st4[0], st4[1]),
      top2: st4.slice(0, 2).map((s) => ({ name: s.t.name, pkt: s.pkt, bz: s.bz, bs: s.bs })),
      matchesSet: allSet,
    });

    // H2H tiebreak
    resetState();
    const t3 = [
      { id: 0, name: 'X', gk: 'G1', cap: 'C1' },
      { id: 1, name: 'Y', gk: 'G2', cap: 'C2' },
      { id: 2, name: 'Z', gk: 'G3', cap: 'C3' },
    ];
    const g3 = { A: t3.map((t) => ({ ...t })) };
    const m3 = generateSchedule(g3, { start: '10:00', gDur: 10, gBreak: 2 });
    setById(m3, 0, 1, 0, 1); setById(m3, 0, 2, 1, 0); setById(m3, 1, 2, 1, 0);
    window.applyDemoScenarioState({ teams: t3, groups: g3, matches: m3, playoffs: [], settings: { advCount: 2 }, logs: [] });
    const st3 = window.getSortedGroupStats('A');
    // X i Y po 3 pkt, Y wygrywa bezpośrednio z X (0-1)
    results.invariants.push({
      name: 'h2h-tiebreak',
      ok: st3[0].t.name === 'Y' && st3[1].t.name === 'X',
      order: st3.map((s) => ({ name: s.t.name, pkt: s.pkt })),
    });

    // Podium blocked
    resetState();
    const finDraw = { id: 402, n: 'WIELKI FINAŁ', t1: { id: 0, name: 'A' }, t2: { id: 1, name: 'B' }, g1: 1, g2: 1, played: true, pen1: null, pen2: null, s1: [], s2: [] };
    window.applyDemoScenarioState({ teams: [], groups: {}, matches: [], playoffs: [finDraw], settings: {}, logs: [] });
    results.invariants.push({
      name: 'podium-blocked-unresolved-draw',
      ok: !window.isMatchDecided(finDraw),
    });

    // Odd bye
    resetState();
    const tOdd = buildTeams(3, (i, f) => (f === 'name' ? `T${i}` : f.toUpperCase()));
    const gOdd = { A: tOdd.map((t) => ({ ...t })) };
    const mOdd = generateSchedule(gOdd, { start: '09:00', gDur: 10, gBreak: 2 });
    results.invariants.push({
      name: 'odd-team-bye-3',
      ok: mOdd.length === 3 && !mOdd.some((m) => m.t1.name === 'PAUZA' || m.t2.name === 'PAUZA'),
      count: mOdd.length,
    });

    // generujPlayoff via engine (8 teams)
    resetState();
    const cfg8 = { teams: 8, groups: 2, adv: 4, bracket: 4 };
    const r8 = runScenario(cfg8);
    window.applyDemoScenarioState({
      teams: buildTeams(8, (i, f) => (f === 'name' ? `D${i}` : f)),
      groups: distributeGroups(buildTeams(8, (i, f) => (f === 'name' ? `D${i}` : f)), 2),
      matches: [],
      playoffs: [],
      settings: { bracketSize: 4, advCount: 4, start: '09:00', gDur: 10, gBreak: 2, afterG: 10, poDur: 12, finDur: 15 },
      logs: [],
    });
    // pełny run z generujPlayoff
    const full8 = runScenario(cfg8);
    window.applyDemoScenarioState({
      teams: full8.ok ? buildTeams(8, (i, f) => (f === 'name' ? `D${i}` : f)) : [],
      groups: {}, matches: [], playoffs: [], settings: {}, logs: [],
    });
    const teams8 = buildTeams(8, (i, f) => (f === 'name' ? `D${i}` : f));
    const groups8 = distributeGroups(teams8, 2);
    const matches8 = generateSchedule(groups8, { start: '09:00', gDur: 10, gBreak: 2, afterG: 10, poDur: 12, finDur: 15 });
    playAllGroupMatches(matches8, teams8, 99);
    const settings8 = { bracketSize: 4, advCount: 4, start: '09:00', gDur: 10, gBreak: 2, afterG: 10, poDur: 12, finDur: 15 };
    window.applyDemoScenarioState({ teams: teams8, groups: groups8, matches: matches8, playoffs: [], settings: settings8, logs: [] });
    window.generujPlayoff();
    const enginePoCount = (window.findGrandFinalMatch() ? 1 : 0);
    results.invariants.push({
      name: 'generujPlayoff-engine-call',
      ok: !!window.findGrandFinalMatch(),
      hasFinal: !!window.findGrandFinalMatch(),
    });

    // Compare engine getAdvancingTeamsFull with manual
    const adv8 = window.getAdvancingTeamsFull();
    results.invariants.push({
      name: 'getAdvancingTeamsFull-8',
      ok: adv8.length === 4,
      adv: adv8.map((t) => t.name),
    });

    // Drabinka 16 — pełna symulacja (buildPlayoffBracket)
    const cfg16sim = { teams: 16, groups: 4, adv: 16, bracket: 16 };
    const sim16 = runScenario(cfg16sim);
    results.invariants.push({
      name: 'bracket-16-full-simulation',
      ok: sim16.ok && sim16.playoffCount === 16 && !!sim16.podium?.gold,
      playoffCount: sim16.playoffCount,
      podium: sim16.podium,
      error: sim16.error,
    });

    // Drabinka 16 — generujPlayoff() z prawdziwego silnika (sonda openMatch)
    resetState();
    const teams16 = buildTeams(16, (i, f) => (f === 'name' ? `D${i + 1}` : f === 'gk' ? `G${i + 1}` : `C${i + 1}`));
    const groups16 = distributeGroups(teams16, 4);
    const settings16 = { bracketSize: 16, advCount: 16, start: '09:00', gDur: 10, gBreak: 2, afterG: 10, poDur: 12, finDur: 15 };
    const matches16 = generateSchedule(groups16, settings16);
    playAllGroupMatches(matches16, teams16, 1600);
    window.applyDemoScenarioState({ teams: teams16, groups: groups16, matches: matches16, playoffs: [], settings: settings16, logs: [] });
    window.generujPlayoff();

    const poIds = [101, 102, 103, 104, 105, 106, 107, 108, 201, 202, 203, 204, 301, 302, 401, 402];
    const probed = [];
    poIds.forEach((id) => {
      try {
        window.openMatch(id, true);
        probed.push({ id, title: document.getElementById('mTitle')?.innerText || '', t1: document.getElementById('mT1')?.innerText || '' });
        document.getElementById('matchModal').style.display = 'none';
      } catch (_) {
        probed.push({ id, title: null });
      }
    });

    const r16 = {
      eightFinals: probed.filter((x) => x.id >= 101 && x.id <= 108 && x.title).length,
      quarters: probed.filter((x) => x.id >= 201 && x.id <= 204 && x.title).length,
      semis: probed.filter((x) => x.id >= 301 && x.id <= 302 && x.title).length,
      bronze: probed.find((x) => x.id === 401)?.title || null,
      final: probed.find((x) => x.id === 402)?.title || null,
      finEngine: window.findGrandFinalMatch(),
    };

    // Rozegraj drabinkę 16 przez saveMatch (silnik)
    poIds.filter((id) => id <= 402).forEach((id, idx) => {
      window.openMatch(id, true);
      const g1 = seededScore(1600 + idx, 3);
      let g2 = seededScore(1600 + idx + 11, 3);
      if (g1 === g2) { document.getElementById('mPen1').value = '5'; document.getElementById('mPen2').value = '4'; }
      document.getElementById('mG1').value = String(g1);
      document.getElementById('mG2').value = String(g2);
      window.saveMatch();
    });

    const fin16 = window.findGrandFinalMatch();
    const m3_16 = probed.find((x) => x.id === 401);
    void m3_16;
    const podium16Ok = fin16 && window.isMatchDecided(fin16);

    results.invariants.push({
      name: 'bracket-16-engine-generujPlayoff',
      ok: r16.eightFinals === 8 && r16.quarters === 4 && r16.semis === 2 && /3\.?\s*MIEJSCE/i.test(r16.bronze || '') && /WIELKI FINAŁ/i.test(r16.final || '') && podium16Ok,
      structure: r16,
      podiumDecided: podium16Ok,
      gold: fin16?.t1?.name,
    });

    return results;
  }, TEAM_COUNTS.flatMap((n) => groupConfigsForTeams(n)));

  // Zapis wyników
  for (const r of runAllInBrowser.scenarios) {
    const label = `${r.cfg?.teams || '?'} drużyn / ${r.cfg?.groups || '?'} grup / awans ${r.cfg?.adv || '?'}`;
    record('scenario', label, r.ok, r.ok
      ? `${r.groupMatches} meczów grupowych, play-off: ${r.playoffCount}, podium: ${r.podium?.gold || '—'}`
      : (r.error || 'FAIL'), { cfg: r.cfg, podium: r.podium, groupMatches: r.groupMatches });
  }

  for (const e of runAllInBrowser.edge) {
    record('edge', e.name, e.ok, e.ok
      ? `Nazwy specjalne OK, podium: ${e.podium?.gold}`
      : (e.error || 'FAIL'), { podium: e.podium });
  }

  for (const inv of runAllInBrowser.invariants) {
    record('invariant', inv.name, inv.ok, inv.ok ? 'OK' : JSON.stringify(inv).slice(0, 200), { warning: inv.name.includes('sync') && inv.ok });
  }

  // Analiza miejsc zapalnych
  const failed = [...report.scenarios, ...report.edgeCases, ...report.invariantTests].filter((x) => !x.ok);
  if (failed.length === 0) {
    report.hotSpots = [
      { area: 'getAdvancingTeamsFull', risk: 'średnie', note: 'Sortowanie po rank grupowym, potem pkt — przy wielu grupach może faworyzować wyższe miejsca z słabszych grup zamiast punktacji globalnej.' },
      { area: 'syncTeamData', risk: 'niskie', note: 'Nazwy uppercasowane, HTML nie escapowany w danych (tylko w renderze) — OK jeśli esc() wszędzie.' },
      { area: 'losujGrupy', risk: 'niskie', note: 'Math.random() — brak kryptograficznej losowości, akceptowalne dla sportu.' },
      { area: 'remis absolutny', risk: 'średnie', note: 'Wymaga ręcznej interwencji sędziego — poprawne, ale operator musi wiedzieć.' },
      { area: 'playoff propagation', risk: 'średnie', note: 'Imperatywne sloty next/loserNext — błąd w jednym meczu kaskaduje.' },
      { area: 'archiwum', risk: 'niskie', note: 'Pełny stan kopiowany — duże payloady przy 40 drużynach.' },
      { area: 'bracket 16', risk: 'niskie', note: 'Pokryte testem bracket-16-full-simulation oraz bracket-16-engine-generujPlayoff.' },
    ];
  } else {
    report.hotSpots.push({ area: 'FAILED TESTS', risk: 'wysokie', note: failed.map((f) => f.name).join(', ') });
  }

  report.finishedAt = new Date().toISOString();
  report.durationSec = Math.round((Date.parse(report.finishedAt) - Date.parse(report.startedAt)) / 1000);
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('\n═══ PODSUMOWANIE ═══');
  console.log(`Testy: ${report.summary.total} | OK: ${report.summary.passed} | FAIL: ${report.summary.failed}`);
  console.log(`Raport: ${REPORT_PATH}`);

  await browser.close();
  server.close();
  process.exit(report.summary.failed > 0 ? 1 : 0);
} catch (err) {
  report.errors.push(String(err));
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.error(err);
  if (browser) await browser.close();
  if (server) server.close();
  process.exit(1);
}
