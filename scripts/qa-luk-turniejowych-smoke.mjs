/**
 * Narrow smoke for luk turniejowych: PO ready, assign PO, WO/retro_dq.
 * Run: node scripts/qa-luk-turniejowych-smoke.mjs
 * Requires: npx playwright (chromium), local index.html
 */
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 8097;

const SETTINGS = {
  start: '10:00',
  gDur: 12,
  gBreak: 4,
  afterG: 10,
  poDur: 10,
  finDur: 12,
  pitchCount: 2,
  finalAfterThird: false,
  advCount: 4,
  bracketSize: 4
};

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      const file = url === '/' ? '/index.html' : url;
      try {
        const data = readFileSync(join(ROOT, file.replace(/^\//, '')));
        const ct = file.endsWith('.js') ? 'application/javascript' : 'text/html';
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('');
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('SKIP: playwright not installed');
    process.exit(0);
  }
  const server = await serve();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  const record = (name, ok, detail) => {
    results.push({ name, ok: !!ok, detail: detail || '' });
    console.log((ok ? 'OK' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''));
  };

  await page.goto('http://127.0.0.1:' + PORT + '/?view=demo', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.assignPlayoffPitchesAndTimes === 'function', null, { timeout: 15000 });

  // PO ready: 3M with ? not ready
  {
    const r = await page.evaluate(() => {
      window.state = window.state || {};
      window.state.playoffs = [
        { id: 301, n: 'Półfinał 1', played: false, t1: { id: 1, name: 'A' }, t2: { id: 2, name: 'B' }, next: 402, loserNext: 401 },
        { id: 302, n: 'Półfinał 2', played: false, t1: { id: 3, name: 'C' }, t2: { id: 4, name: 'D' }, next: 402, loserNext: 401 },
        { id: 401, n: 'MECZ O 3. MIEJSCE', played: false, t1: { name: '?' }, t2: { name: '?' } },
        { id: 402, n: 'WIELKI FINAŁ', played: false, t1: { name: '?' }, t2: { name: '?' } }
      ];
      const m3 = window.state.playoffs[2];
      const ready = window.isPlayoffMatchReadyToScore(m3);
      return { ready, reason: window.getPlayoffMatchNotReadyReason(m3) };
    });
    record('PO ready: 3M z ? niegotowy', r.ready === false, r.reason);
  }

  // Assign PO: parallel SF
  {
    const r = await page.evaluate((settings) => {
      const pool = [
        { id: 0, name: 'T1' }, { id: 1, name: 'T2' }, { id: 2, name: 'T3' }, { id: 3, name: 'T4' }
      ];
      const po = [
        { id: 301, n: 'Półfinał 1', time: '11:00', t1: pool[0], t2: pool[3], g1: 0, g2: 0, played: false, next: 402, slot: 't1', loserNext: 401, loserSlot: 't1' },
        { id: 302, n: 'Półfinał 2', time: '11:00', t1: pool[1], t2: pool[2], g1: 0, g2: 0, played: false, next: 402, slot: 't2', loserNext: 401, loserSlot: 't2' },
        { id: 401, n: 'MECZ O 3. MIEJSCE', time: '11:00', t1: { name: '?' }, t2: { name: '?' }, g1: 0, g2: 0, played: false },
        { id: 402, n: 'WIELKI FINAŁ', time: '11:00', t1: { name: '?' }, t2: { name: '?' }, g1: 0, g2: 0, played: false }
      ];
      window.assignPlayoffPitchesAndTimes(po, '11:00', settings, 2);
      const sf1 = po.find((m) => m.id === 301);
      const sf2 = po.find((m) => m.id === 302);
      const third = po.find((m) => m.id === 401);
      const sameTime = sf1.time === sf2.time;
      const diffPitch = sf1.pitch !== sf2.pitch;
      const gap = 2 * window.getPlayoffSlotLen(sf1, settings);
      const thirdOk = window.timeToMinutes(third.time) >= window.timeToMinutes(window.addMin(sf1.time, gap));
      return { sameTime, diffPitch, thirdOk, sf1: sf1.time, sf2: sf2.time, third: third.time, p1: sf1.pitch, p2: sf2.pitch };
    }, SETTINGS);
    record('PO grafik: SF równolegle + 3M z gapem', r.sameTime && r.diffPitch && r.thirdOk, JSON.stringify(r));
  }

  // WO + retro
  {
    const r = await page.evaluate((settings) => {
      const teams = Array.from({ length: 4 }, (_, i) => ({ id: i, name: 'Team ' + (i + 1), gk: '', cap: '' }));
      const matches = [
        { id: 1, group: 'A', time: '10:00', t1: teams[0], t2: teams[1], g1: 2, g2: 1, played: true, s1: [], s2: [] },
        { id: 2, group: 'A', time: '10:16', t1: teams[2], t2: teams[3], g1: 0, g2: 0, played: false, s1: [], s2: [] },
        { id: 3, group: 'A', time: '10:32', t1: teams[0], t2: teams[2], g1: 1, g2: 0, played: true, s1: [], s2: [] }
      ];
      window.state = {
        teams, groups: { A: teams }, matches, playoffs: [{ id: 301, n: 'PF' }], settings: Object.assign({}, settings),
        meta: {}, logs: []
      };
      const preview = window.buildWalkoverRepackPreview(0, 'retro_dq');
      if (!preview.ok) return { ok: false, detail: preview.error };
      preview.clearPlayoffs = true;
      window.commitWalkoverRepackPreview(preview);
      const woPlayed = (window.state.matches || []).filter((m) => m.t1.id === 0 || m.t2.id === 0)
        .every((m) => m.played && m.resultType === 'walkover' && m.preWalkover);
      const status = window.state.meta.teamStatus && window.state.meta.teamStatus[0];
      const poCleared = !window.state.playoffs.length;
      const rev = window.buildWalkoverRevertPreview(0);
      if (!rev.ok) return { ok: false, detail: 'revert ' + rev.error };
      window.commitWalkoverRepackPreview(rev);
      const restored = window.state.matches.find((m) => m.id === 1);
      return {
        ok: woPlayed && status === 'disqualified' && poCleared && restored && restored.played && restored.g1 === 2,
        detail: 'status=' + status + ' po=' + (window.state.playoffs || []).length + ' g1=' + (restored && restored.g1)
      };
    }, SETTINGS);
    record('WO retro_dq + cofnij', r.ok, r.detail);
  }

  // squadSize UI exists
  {
    const r = await page.evaluate(() => {
      return !!(document.getElementById('tp-squad-size-6') && document.getElementById('tp-squad-size-7') && document.getElementById('t-final-after-third'));
    });
    record('UI Start: squadSize + finalAfterThird', r);
  }

  writeFileSync(join(ROOT, 'scripts/qa-luk-turniejowych-smoke-report.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  await browser.close();
  server.close();
  const failed = results.filter((x) => !x.ok).length;
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
