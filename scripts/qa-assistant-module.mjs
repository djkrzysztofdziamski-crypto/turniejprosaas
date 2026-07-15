/**
 * Test modułu asystenta (logika token + zapis LIVE) — mock RTDB
 * Uruchom: node scripts/qa-assistant-module.mjs
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dir = dirname(fileURLToPath(import.meta.url));
const { generateAssistantToken, assistantSaveMatch } = require(join(__dir, '../functions/lib/assistant/index.js'));

function mockDb(seed) {
  const data = JSON.parse(JSON.stringify(seed));
  return {
    ref(path) {
      const parts = path.split('/').filter(Boolean);
      return {
        async once() {
          let cur = data;
          for (const p of parts) cur = cur?.[p];
          return { val: () => cur ?? null };
        },
        async set(val) {
          let cur = data;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = val;
        },
        async update(patch) {
          let cur = data;
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (i === parts.length - 1) {
              if (!cur[p]) cur[p] = {};
              Object.assign(cur[p], patch);
            } else {
              if (!cur[p]) cur[p] = {};
              cur = cur[p];
            }
          }
        },
      };
    },
    _data: data,
  };
}

const KEY = 'TP-ABCD-EFGH';
const seed = {
  licencje: {
    [KEY]: { status: 'aktywny', wygasa: Date.now() + 86400000 },
  },
  asystenci: {},
  turnieje_uzytkownikow: {
    [KEY]: {
      teams: [{ id: 1, name: 'A', gk: 'G1', cap: 'C1' }, { id: 2, name: 'B', gk: 'G2', cap: 'C2' }],
      matches: [{ id: 10, t1: { id: 1, name: 'A' }, t2: { id: 2, name: 'B' }, g1: 0, g2: 0, played: false, s1: [], s2: [] }],
      playoffs: [],
      meta: {},
      logs: [],
    },
  },
};

const db = mockDb(seed);
const { token } = await generateAssistantToken(db, KEY);
if (!token || token.length < 16) throw new Error('Token not generated');

const liveRes = await assistantSaveMatch(db, {
  key: KEY,
  token,
  matchId: 10,
  isPo: false,
  g1: 2,
  g2: 1,
  live: true,
  s1: [{ name: 'STRIKER' }],
  s2: [],
});

if (!liveRes.ok) throw new Error('Live save failed');

const state = db._data.turnieje_uzytkownikow[KEY];
if (state.matches[0].g1 !== 2 || state.matches[0].g2 !== 1) throw new Error('Score not updated');
if (state.matches[0].played !== false) throw new Error('Live save must not mark played');
if (state.meta.liveMatchId !== 10) throw new Error('liveMatchId not set');

const finalRes = await assistantSaveMatch(db, {
  key: KEY,
  token,
  matchId: 10,
  isPo: false,
  g1: 2,
  g2: 1,
  s1: [{ name: 'STRIKER' }],
  s2: [],
});

if (!finalRes.ok) throw new Error('Final save failed');
if (db._data.turnieje_uzytkownikow[KEY].matches[0].played !== true) throw new Error('Final save must mark played');
if (db._data.turnieje_uzytkownikow[KEY].meta.liveMatchId != null) throw new Error('liveMatchId must be cleared');

console.log('✓ generateAssistantToken');
console.log('✓ assistantSaveMatch live');
console.log('✓ assistantSaveMatch final');
console.log('Assistant module QA passed.');
