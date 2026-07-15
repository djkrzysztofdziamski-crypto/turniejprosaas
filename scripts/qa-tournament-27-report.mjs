/**
 * Pełna symulacja turnieju 27 drużyn — licencja z env LICENSE_KEY
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const LICENSE = process.env.LICENSE_KEY || 'TP-5YGF-ZS4S';
const BASE = process.env.APP_URL || 'https://app.turniejomat.pl/';
const ARCHIVE_NAME = `TURNIEJ TEST 27 DRUZYN ${new Date().toISOString().slice(0, 10)}`;

const TEAMS = [
  { name: 'FC Orlik Poznań', gk: 'K. Nowak', cap: 'M. Kowalski' },
  { name: 'Grom Luboń', gk: 'P. Wiśniewski', cap: 'J. Zieliński' },
  { name: 'Pogoń Swarzędz', gk: 'T. Wójcik', cap: 'A. Kamiński' },
  { name: 'Warta Kórnik', gk: 'Ł. Lewandowski', cap: 'R. Szymański' },
  { name: 'Lech Mini Strzałkowo', gk: 'M. Dąbrowski', cap: 'P. Kozłowski' },
  { name: 'Unia Mosina', gk: 'B. Jankowski', cap: 'K. Mazur' },
  { name: 'Sparta Komorniki', gk: 'D. Kwiatkowski', cap: 'F. Krawczyk' },
  { name: 'Amber Opalenica', gk: 'S. Piotrowski', cap: 'L. Grabowski' },
  { name: 'Kotwica Pobiedziska', gk: 'N. Nowakowski', cap: 'H. Pawłowski' },
  { name: 'Victoria Murowana', gk: 'O. Michalski', cap: 'E. Król' },
  { name: 'Polonia Czerwonak', gk: 'W. Wieczorek', cap: 'U. Jabłoński' },
  { name: 'Stella Baranowo', gk: 'Z. Majewski', cap: 'V. Olszewski' },
  { name: 'Jaguar Tulce', gk: 'C. Jaworski', cap: 'Y. Malinowski' },
  { name: 'Eagles Swarzędz', gk: 'G. Adamczyk', cap: 'I. Dudek' },
  { name: 'Rapid Puszczykowo', gk: 'Q. Sikora', cap: 'X. Walczak' },
  { name: 'Huragan Krzyżowniki', gk: 'J. Rutkowski', cap: 'A. Michalak' },
  { name: 'Błękitni Rogalin', gk: 'M. Szewczyk', cap: 'B. Ostrowski' },
  { name: 'Tytani Dopiewo', gk: 'P. Tomaszewski', cap: 'C. Pietrzak' },
  { name: 'Wolves Skórzewo', gk: 'R. Zalewski', cap: 'D. Jasiński' },
  { name: 'Feniks Stęszew', gk: 'T. Górski', cap: 'E. Zawadzki' },
  { name: 'Lwy Kiekrz', gk: 'K. Sadowski', cap: 'F. Bak' },
  { name: 'Tornado Buk', gk: 'L. Chmielewski', cap: 'G. Borkowski' },
  { name: 'Sharks Czmoń', gk: 'N. Czarnecki', cap: 'H. Sawicki' },
  { name: 'Thunder Kleszczewo', gk: 'O. Kubiak', cap: 'I. Maciejewski' },
  { name: 'Storm Kostrzyn', gk: 'W. Sokołowski', cap: 'J. Urbański' },
  { name: 'Astra Rakoniewice', gk: 'Z. Kaczmarek', cap: 'K. Pawlak' },
  { name: 'Galaxy Przeźmierowo', gk: 'C. Krajewski', cap: 'M. Witkowski' },
];

const report = {
  license: LICENSE,
  startedAt: new Date().toISOString(),
  steps: [],
  groups: {},
  groupMatches: 0,
  playoffMatches: [],
  criticalTests: {},
  archive: null,
  podium: null,
  pool: [],
  errors: [],
};

function log(step, detail, ok = true) {
  report.steps.push({ step, detail, ok, at: new Date().toISOString() });
  console.log(`${ok ? '✓' : '✗'} ${step}: ${detail}`);
}

function addMin(time, min) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(0, 0, 0, h, m);
  d.setMinutes(d.getMinutes() + min);
  return d.toTimeString().slice(0, 5);
}

function buildTeams() {
  return TEAMS.map((t, i) => ({
    id: i,
    name: t.name.toUpperCase(),
    gk: t.gk.toUpperCase(),
    cap: t.cap.toUpperCase(),
  }));
}

function buildGroups(teams) {
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  const groups = {};
  names.forEach((g) => { groups[g] = []; });
  teams.forEach((t, i) => {
    groups[names[i % 6]].push({ id: t.id, name: t.name, gk: t.gk, cap: t.cap });
  });
  return groups;
}

function buildSchedule(groups, settings) {
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
  let curr = settings.start;
  return pool.map((m, idx) => {
    const match = { ...m, id: idx + 1, time: curr };
    curr = addMin(curr, settings.gDur + settings.gBreak);
    return match;
  });
}

function applyGroupResult(groups, matches, group, i, j, g1, g2, s1 = [], s2 = []) {
  const gi = groups[group].findIndex((t) => t.id === groups[group][i].id);
  const gj = groups[group].findIndex((t) => t.id === groups[group][j].id);
  const a = Math.min(gi, gj);
  const b = Math.max(gi, gj);
  const m = matches.find((x) => {
    if (x.group !== group) return false;
    const xi = groups[group].findIndex((t) => t.id === x.t1.id);
    const xj = groups[group].findIndex((t) => t.id === x.t2.id);
    return Math.min(xi, xj) === a && Math.max(xi, xj) === b;
  });
  if (!m) throw new Error(`Brak meczu ${group} ${i}-${j}`);
  m.g1 = g1;
  m.g2 = g2;
  m.played = true;
  m.s1 = s1.map((name) => ({ name }));
  m.s2 = s2.map((name) => ({ name }));
}

function scoreGroupPhase(groups, matches) {
  ['A', 'B', 'C'].forEach((g) => {
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        if (i === 0 && j === 1) applyGroupResult(groups, matches, g, i, j, 2, 1, ['KOWALSKI'], ['ZIELINSKI']);
        else if (i === 0 && j === 2) applyGroupResult(groups, matches, g, i, j, 3, 0, ['KOWALSKI', 'KOWALSKI', 'MAZUR'], []);
        else if (i === 0 && j === 3) applyGroupResult(groups, matches, g, i, j, 1, 1, ['KOWALSKI'], ['KRAWCZYK']);
        else if (i === 0 && j === 4) applyGroupResult(groups, matches, g, i, j, 2, 0, ['KOWALSKI', 'MAZUR'], []);
        else if (i === 1 && j === 2) applyGroupResult(groups, matches, g, i, j, 0, 2, [], ['ZIELINSKI', 'ZIELINSKI']);
        else if (i === 1 && j === 3) applyGroupResult(groups, matches, g, i, j, 1, 0, ['ZIELINSKI'], ['KRAWCZYK']);
        else if (i === 1 && j === 4) applyGroupResult(groups, matches, g, i, j, 0, 3, [], ['PAWLOWSKI', 'PAWLOWSKI', 'PAWLOWSKI']);
        else if (i === 2 && j === 3) applyGroupResult(groups, matches, g, i, j, 2, 2, ['MAZUR', 'MAZUR'], ['KRAWCZYK', 'KRAWCZYK']);
        else if (i === 2 && j === 4) applyGroupResult(groups, matches, g, i, j, 1, 0, ['MAZUR'], ['PAWLOWSKI']);
        else if (i === 3 && j === 4) applyGroupResult(groups, matches, g, i, j, 0, 1, [], ['PAWLOWSKI']);
      }
    }
  });

  // Grupa D (Warta, Victoria, Huragan, Tornado) — remis absolutny 1. vs 2.
  applyGroupResult(groups, matches, 'D', 0, 1, 1, 1, ['LEWANDOWSKI'], ['KROL']);
  applyGroupResult(groups, matches, 'D', 2, 3, 0, 0, [], []);
  applyGroupResult(groups, matches, 'D', 0, 2, 2, 0, ['LEWANDOWSKI', 'LEWANDOWSKI'], []);
  applyGroupResult(groups, matches, 'D', 0, 3, 2, 0, ['LEWANDOWSKI', 'LEWANDOWSKI'], []);
  applyGroupResult(groups, matches, 'D', 1, 2, 2, 0, ['KROL', 'KROL'], []);
  applyGroupResult(groups, matches, 'D', 1, 3, 2, 0, ['KROL', 'KROL'], []);

  ['E', 'F'].forEach((g) => {
    applyGroupResult(groups, matches, g, 0, 1, 2, 0, ['KOWALSKI', 'KOWALSKI'], []);
    applyGroupResult(groups, matches, g, 2, 3, 1, 1, ['MAZUR'], ['KRAWCZYK']);
    applyGroupResult(groups, matches, g, 0, 2, 3, 1, ['KOWALSKI', 'KOWALSKI', 'KOWALSKI'], ['MAZUR']);
    applyGroupResult(groups, matches, g, 1, 3, 0, 2, [], ['ZIELINSKI', 'ZIELINSKI']);
    applyGroupResult(groups, matches, g, 0, 3, 1, 0, ['KOWALSKI'], ['KRAWCZYK']);
    applyGroupResult(groups, matches, g, 1, 2, 2, 1, ['ZIELINSKI', 'ZIELINSKI'], ['MAZUR']);
  });
}

async function fbGet(page, key) {
  return page.evaluate(async (k) => {
    const snap = await firebase.database().ref('turnieje_uzytkownikow/' + k).once('value');
    return snap.val();
  }, key);
}

async function fbSet(page, key, payload) {
  return page.evaluate(async ([k, data]) => {
    await firebase.database().ref('turnieje_uzytkownikow/' + k).set(data);
  }, [key, payload]);
}

async function fbLic(page, key) {
  return page.evaluate(async (k) => {
    const snap = await firebase.database().ref('licencje/' + k).once('value');
    return snap.val();
  }, key);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
let dialogHandler = async (d) => { try { await d.accept(); } catch (_) {} };
page.on('dialog', (d) => dialogHandler(d));

try {
  // ── 1. Aktywacja ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#license-input', LICENSE);
  await Promise.all([
    page.waitForFunction(() => location.search.includes('id='), { timeout: 40000 }),
    page.click('button:has-text("MAM KLUCZ")'),
  ]);
  await page.waitForSelector('#view-app.active', { timeout: 20000 });
  await page.waitForFunction(() => typeof window.generateInputs === 'function', { timeout: 20000 });

  const lic = await fbLic(page, LICENSE);
  if (!lic) throw new Error('Licencja nie istnieje w Firebase');
  log('1. Aktywacja licencji', `${LICENSE} | status: ${lic.status} | notatka: ${lic.notatka || '—'}`);

  // ── 2–6. Budowa stanu turnieju ──
  const teams = buildTeams();
  const groups = buildGroups(teams);
  const settings = {
    bracketSize: 8,
    advCount: 8,
    start: '09:00',
    gDur: 12,
    gBreak: 3,
    afterG: 15,
    poDur: 15,
    finDur: 18,
  };
  const matches = buildSchedule(groups, settings);
  scoreGroupPhase(groups, matches);

  report.groups = Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v.map((t) => t.name)])
  );
  report.groupMatches = matches.length;
  const draws = matches.filter((m) => m.played && m.g1 === m.g2).length;

  await fbSet(page, LICENSE, {
    teams,
    groups,
    matches,
    playoffs: [],
    settings,
    logs: [`[${new Date().toLocaleTimeString('pl-PL')}] QA: utworzono turniej 27 drużyn / 6 grup`],
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view-app.active', { timeout: 20000 });
  await page.waitForFunction(() => typeof window.calcTables === 'function', { timeout: 15000 });

  log('2. Konfiguracja', '27 drużyn, 6 grup (5/5/5/4/4/4), drabinka 8, awans 8');
  log('3. Składy', `27 drużyn z nazwą + bramkarzem + kapitanem`);
  log('4. Grupy', Object.entries(report.groups).map(([g, a]) => `${g}:${a.length}`).join(' '));
  log('5. Terminarz', `${matches.length} meczów grupowych`);
  log('6. Faza grupowa', `Wszystkie wyniki zapisane, ${draws} remisów grupowych (bez karnych)`);

  // ── 7. Remis absolutny Gr. D ──
  await page.click('button:has-text("Tabele")');
  await page.waitForTimeout(1000);
  const absBefore = await page.evaluate(() => {
    const st = window.getSortedGroupStats('D');
    const btn = document.getElementById('btn-start-po');
    return {
      top2: st.slice(0, 2).map((s) => ({ team: s.t.name, pkt: s.pkt, bz: s.bz, bs: s.bs })),
      isAbsolute: window.isAbsoluteRemis(st[0], st[1]),
      blocked: btn?.disabled,
      btnText: btn?.innerText,
    };
  });
  report.criticalTests.absoluteTieDetected = absBefore.isAbsolute && absBefore.blocked;
  log('7. Remis absolutny Gr.D', `${absBefore.top2.map((t) => t.team).join(' = ')} (${absBefore.top2[0]?.pkt} pkt) | blokada: ${absBefore.blocked}`, absBefore.isAbsolute);

  // Rozstrzygnięcie remisu absolutnego — zatwierdzenie kolejności Gr.D
  const dataMid = await fbGet(page, LICENSE);
  dataMid.settings.customTableOrder = { D: [groups.D[0].id, groups.D[1].id, groups.D[2].id, groups.D[3].id] };
  dataMid.settings.confirmedTableOrder = { D: true };
  await fbSet(page, LICENSE, dataMid);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view-app.active');
  await page.click('button:has-text("Tabele")');
  await page.waitForTimeout(800);

  const absAfter = await page.evaluate(() => ({
    blocked: document.getElementById('btn-start-po')?.disabled,
    order: window.getSortedGroupStats('D').map((s) => s.t.name),
  }));
  report.criticalTests.absoluteTieResolved = !absAfter.blocked;
  log('8. Rozstrzygnięcie remisu', `Kolejność Gr.D: ${absAfter.order.slice(0, 2).join(' > ')}`, report.criticalTests.absoluteTieResolved);

  // ── 9. Play-off ──
  await page.click('#btn-start-po');
  await page.waitForSelector('#playoff.active', { timeout: 10000 });
  const pool = await page.evaluate(() => window.getAdvancingTeamsFull().map((t) => t.name));
  report.pool = pool;
  log('9. Play-off', `Awansują: ${pool.join(', ')}`);

  // ── 10. Mecze pucharowe ──
  const poResults = {
    201: { g1: 3, g2: 1, s1: ['KOWALSKI', 'KOWALSKI', 'MAZUR'], s2: ['ZIELINSKI'] },
    202: { g1: 1, g2: 1, pen1: 4, pen2: 3, s1: ['KOWALSKI'], s2: ['ZIELINSKI'] },
    203: { g1: 2, g2: 0, s1: ['KOWALSKI', 'KOWALSKI'], s2: [] },
    204: { g1: 0, g2: 2, s1: [], s2: ['ZIELINSKI', 'ZIELINSKI'] },
    301: { g1: 2, g2: 1, s1: ['KOWALSKI', 'KOWALSKI'], s2: ['ZIELINSKI'] },
    302: { g1: 1, g2: 1, pen1: 5, pen2: 4, s1: ['KOWALSKI'], s2: ['ZIELINSKI'] },
    401: { g1: 2, g2: 0, s1: ['ZIELINSKI', 'ZIELINSKI'], s2: [] },
    402: { g1: 2, g2: 2, pen1: 5, pen2: 4, s1: ['KOWALSKI', 'KOWALSKI'], s2: ['ZIELINSKI', 'ZIELINSKI'] },
  };

  // Test UI: karny remis 4:4 odrzucony
  await page.evaluate(() => window.openMatch(202, true));
  await page.fill('#mG1', '1');
  await page.fill('#mG2', '1');
  await page.fill('#mPen1', '4');
  await page.fill('#mPen2', '4');
  let penReject = false;
  dialogHandler = async (d) => {
    penReject = /zwycięzc|przewag|4:4/i.test(d.message());
    await d.accept();
  };
  await page.click('button:has-text("ZAPISZ WYNIK MECZU")');
  await page.waitForTimeout(600);
  dialogHandler = async (d) => { try { await d.accept(); } catch (_) {} };
  report.criticalTests.penaltyTieRejected = penReject;
  log('10a. Karne 4:4 odrzucone', penReject ? 'System wymaga zwycięzcy — OK' : 'Brak alertu', penReject);

  await page.fill('#mPen1', '4');
  await page.fill('#mPen2', '3');
  await page.click('button:has-text("ZAPISZ WYNIK MECZU")');
  await page.waitForTimeout(500);

  await page.evaluate((results) => {
    const getW = (x) => x.g1 > x.g2 ? x.t1 : (x.g1 < x.g2 ? x.t2 : (x.pen1 > x.pen2 ? x.t1 : x.t2));
    const getL = (x) => x.g1 > x.g2 ? x.t2 : (x.g1 < x.g2 ? x.t1 : (x.pen1 > x.pen2 ? x.t2 : x.t1));
    const key = new URLSearchParams(location.search).get('id');
    return firebase.database().ref('turnieje_uzytkownikow/' + key).once('value').then((snap) => {
      const d = snap.val();
      const applyPo = (id, r) => {
        const m = d.playoffs.find((x) => x.id === id);
        if (!m || m.played) return;
        m.g1 = r.g1; m.g2 = r.g2; m.played = true;
        m.s1 = (r.s1 || []).map((name) => ({ name }));
        m.s2 = (r.s2 || []).map((name) => ({ name }));
        if (r.pen1 != null) { m.pen1 = r.pen1; m.pen2 = r.pen2; }
        const w = getW(m); const l = getL(m);
        if (m.next) { const nm = d.playoffs.find((p) => p.id === m.next); if (nm) nm[m.slot] = w; }
        if (m.loserNext) { const nlm = d.playoffs.find((p) => p.id === m.loserNext); if (nlm) nlm[m.loserSlot || 't2'] = l; }
      };
      [201, 203, 204, 301, 302, 401, 402].forEach((id) => applyPo(id, results[id]));
      return firebase.database().ref('turnieje_uzytkownikow/' + key).set(d);
    });
  }, poResults);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view-app.active');
  const poPlayed = await page.evaluate(async () => {
    const key = new URLSearchParams(location.search).get('id');
    const d = (await firebase.database().ref('turnieje_uzytkownikow/' + key).once('value')).val();
    return d.playoffs.map((m) => ({
      n: m.n,
      t1: m.t1.name,
      t2: m.t2.name,
      score: m.played ? `${m.g1}:${m.g2}${m.pen1 != null ? ` (k. ${m.pen1}:${m.pen2})` : ''}` : '-:-',
    }));
  });
  report.playoffMatches = poPlayed;
  const penCount = poPlayed.filter((m) => m.score.includes('k.')).length;
  log('10b. Play-off', `${poPlayed.filter((m) => m.score !== '-:-').length}/8 meczów, ${penCount} z karnymi`);

  // ── 11. Podium ──
  await page.click('button:has-text("Podium")');
  await page.waitForTimeout(800);
  const podium = await page.evaluate(() => {
    const key = new URLSearchParams(location.search).get('id');
    return firebase.database().ref('turnieje_uzytkownikow/' + key).once('value').then((snap) => {
      const d = snap.val();
      const fin = d.playoffs.find((m) => /WIELKI FINAŁ/i.test(m.n));
      const third = d.playoffs.find((m) => /3\. MIEJSCE/i.test(m.n));
      const getW = (m) => m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2));
      const getL = (m) => m.g1 > m.g2 ? m.t2 : (m.g1 < m.g2 ? m.t1 : (m.pen1 > m.pen2 ? m.t2 : m.t1));
      return {
        gold: fin?.played ? getW(fin).name : null,
        silver: fin?.played ? getL(fin).name : null,
        bronze: third?.played ? getW(third).name : null,
        finalScore: fin?.played ? `${fin.g1}:${fin.g2}${fin.pen1 != null ? ` (k. ${fin.pen1}:${fin.pen2})` : ''}` : null,
      };
    });
  });
  report.podium = podium;
  log('11. Podium', `🥇 ${podium.gold} | 🥈 ${podium.silver} | 🥉 ${podium.bronze} | Finał: ${podium.finalScore}`);

  // ── 12. Archiwum ──
  const archiveResult = await page.evaluate(async ([name, key]) => {
    const d = (await firebase.database().ref('turnieje_uzytkownikow/' + key).once('value')).val();
    const archivePayload = {
      ...d,
      _meta_name: name.trim().toUpperCase(),
      _meta_date: new Date().toLocaleString('pl-PL'),
      _license_owner: key,
    };
    const [r1, r2] = await Promise.all([
      firebase.database().ref('turnieje_uzytkownikow/' + key + '/archiwum').push(archivePayload),
      firebase.database().ref('archiwum').push(archivePayload),
    ]);
    return { localKey: r1.key, centralKey: r2.key, name: archivePayload._meta_name };
  }, [ARCHIVE_NAME, LICENSE]);

  report.archive = archiveResult;
  log('12. Archiwum', `Zapisano "${archiveResult.name}" (local: ${archiveResult.localKey})`);

  report.finishedAt = new Date().toISOString();
  report.allCriticalPassed = Object.values(report.criticalTests).every(Boolean);

} catch (err) {
  report.errors.push(err.message);
  log('BŁĄD', err.message, false);
} finally {
  await browser.close();
}

const outPath = join(__dir, 'qa-tournament-27-report.json');
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('\nRaport:', outPath);
console.log('Krytyczne:', report.criticalTests);
process.exit(report.errors.length ? 1 : 0);
