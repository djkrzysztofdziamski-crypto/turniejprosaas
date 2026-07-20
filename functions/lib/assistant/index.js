const crypto = require('crypto');
const { KEY_RE } = require('../licensing/keys');

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function assertActiveLicense(db, key) {
  if (!KEY_RE.test(key)) {
    const err = new Error('Nieprawidłowy klucz licencji.');
    err.code = 'invalid-argument';
    throw err;
  }
  const snap = await db.ref(`licencje/${key}`).once('value');
  const lic = snap.val();
  if (!lic || lic.status !== 'aktywny') {
    const err = new Error('Licencja nieaktywna lub nie istnieje.');
    err.code = 'failed-precondition';
    throw err;
  }
  if (lic.wygasa && lic.wygasa <= Date.now()) {
    const err = new Error('Licencja wygasła.');
    err.code = 'failed-precondition';
    throw err;
  }
  return lic;
}

async function verifyAssistantToken(db, key, token) {
  const snap = await db.ref(`asystenci/${key}`).once('value');
  const data = snap.val();
  if (!data || !data.token || data.token !== token) {
    const err = new Error('Nieprawidłowy token asystenta.');
    err.code = 'permission-denied';
    throw err;
  }
  if (data.expiresAt && data.expiresAt <= Date.now()) {
    const err = new Error('Token asystenta wygasł — poproś organizatora o nowy link.');
    err.code = 'permission-denied';
    throw err;
  }
  return data;
}

async function generateAssistantToken(db, key) {
  await assertActiveLicense(db, key);
  const licSnap = await db.ref(`licencje/${key}`).once('value');
  const lic = licSnap.val();
  const now = Date.now();
  const token = generateToken();
  const expiresAt = lic.wygasa || now + 72 * 60 * 60 * 1000;
  await db.ref(`asystenci/${key}`).set({
    token,
    createdAt: now,
    expiresAt,
  });
  return { token, expiresAt };
}

function applyPlayoffWin(state, match) {
  const getW = (m) => (m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2)));
  const getL = (m) => (m.g1 > m.g2 ? m.t2 : (m.g1 < m.g2 ? m.t1 : (m.pen1 > m.pen2 ? m.t2 : m.t1)));
  const w = getW(match);
  const l = getL(match);
  if (match.next) {
    const nm = (state.playoffs || []).find((m) => m.id === match.next);
    if (nm && match.slot) nm[match.slot] = w;
  }
  if (match.loserNext) {
    const targetId = match.loserNext;
    const targetSlot = match.loserSlot || match.slotLoser || 't2';
    const nlm = (state.playoffs || []).find((m) => m.id === targetId);
    if (nlm) nlm[targetSlot] = l;
  }
}

async function assistantSaveMatch(db, payload) {
  const key = String(payload?.key || '').trim();
  const token = String(payload?.token || '').trim();
  const matchId = parseInt(payload?.matchId, 10);
  const isPo = !!payload?.isPo;
  const g1 = parseInt(payload?.g1, 10);
  const g2 = parseInt(payload?.g2, 10);

  const isLiveUpdate = payload?.live === true;

  if (!key || !token || !matchId || isNaN(g1) || isNaN(g2) || g1 < 0 || g2 < 0) {
    const err = new Error('Niepełne dane meczu.');
    err.code = 'invalid-argument';
    throw err;
  }

  await assertActiveLicense(db, key);
  await verifyAssistantToken(db, key, token);

  const path = `turnieje_uzytkownikow/${key}`;
  const snap = await db.ref(path).once('value');
  const state = snap.val() || {};
  const arr = isPo ? (state.playoffs || []) : (state.matches || []);
  const idx = arr.findIndex((m) => m.id === matchId);
  if (idx === -1) {
    const err = new Error('Nie znaleziono meczu.');
    err.code = 'not-found';
    throw err;
  }

  const match = { ...arr[idx] };
  if (match.t1?.id === -99 || match.t2?.id === -99) {
    const err = new Error('Mecz z wolnym losem jest rozstrzygany automatycznie.');
    err.code = 'failed-precondition';
    throw err;
  }

  if (!isLiveUpdate && isPo && g1 === g2) {
    const pen1 = parseInt(payload?.pen1, 10);
    const pen2 = parseInt(payload?.pen2, 10);
    if (isNaN(pen1) || isNaN(pen2) || pen1 === pen2) {
      const err = new Error('Play-off remis wymaga wyniku karnych z przewagą.');
      err.code = 'invalid-argument';
      throw err;
    }
    match.pen1 = pen1;
    match.pen2 = pen2;
  } else if (!isLiveUpdate) {
    match.pen1 = null;
    match.pen2 = null;
  }

  match.g1 = g1;
  match.g2 = g2;
  match.played = !isLiveUpdate;
  if (!isLiveUpdate) match.pitch = null;

  if (Array.isArray(payload?.s1)) {
    match.s1 = payload.s1.map((s) => ({ name: String(s.name || '').trim().toUpperCase() })).filter((s) => s.name);
  }
  if (Array.isArray(payload?.s2)) {
    match.s2 = payload.s2.map((s) => ({ name: String(s.name || '').trim().toUpperCase() })).filter((s) => s.name);
  }

  const normalizeCards = (arr) => {
    if (!Array.isArray(arr)) return undefined;
    return arr
      .map((c) => {
        const type = c && c.type === 'R' ? 'R' : 'Y';
        const name = String((c && c.name) || '').trim().toUpperCase();
        const out = { type, name };
        if (c && c.playerId) out.playerId = String(c.playerId);
        if (c && c.viaSecondYellow) out.viaSecondYellow = true;
        return out;
      })
      .filter((c) => c.type === 'Y' || c.type === 'R');
  };
  if (Array.isArray(payload?.cards1)) match.cards1 = normalizeCards(payload.cards1);
  if (Array.isArray(payload?.cards2)) match.cards2 = normalizeCards(payload.cards2);

  arr[idx] = match;
  if (isPo) state.playoffs = arr;
  else state.matches = arr;

  if (!state.meta) state.meta = {};
  if (isLiveUpdate) {
    state.meta.liveMatchId = matchId;
    state.meta.liveMatchIsPo = isPo;
  } else {
    delete state.meta.liveMatchId;
    delete state.meta.liveMatchIsPo;
    if (isPo) applyPlayoffWin(state, match);
  }

  if (!state.logs) state.logs = [];
  const time = new Date().toLocaleTimeString('pl-PL');
  if (isLiveUpdate) {
    state.logs.push(`[${time}] Asystent LIVE: ${match.t1?.name || '?'} ${g1}:${g2} ${match.t2?.name || '?'}.`);
  } else {
    state.logs.push(`[${time}] Asystent: wynik meczu #${matchId} — ${match.t1?.name || '?'} ${g1}:${g2} ${match.t2?.name || '?'}.`);
  }
  if (state.logs.length > 50) state.logs.shift();

  const { active, archiwum, wstrzymane, ...toSave } = state;
  await db.ref(path).update(toSave);

  return { ok: true, matchId };
}

module.exports = {
  generateAssistantToken,
  assistantSaveMatch,
  verifyAssistantToken,
};
