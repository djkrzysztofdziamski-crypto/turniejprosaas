const crypto = require('crypto');
const admin = require('firebase-admin');
const { KEY_RE } = require('../licensing/keys');

const CAPTAIN_ROSTER_MAX = 15;
const BIO_MAX = 500;
const PHOTO_MAX_BYTES = 450 * 1024;
const INVITE_MAX_MS = 14 * 24 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function fail(message, code) {
  const err = new Error(message);
  err.code = code || 'invalid-argument';
  throw err;
}

async function assertActiveLicense(db, key) {
  if (!KEY_RE.test(key)) fail('Nieprawidłowy klucz licencji.', 'invalid-argument');
  const snap = await db.ref(`licencje/${key}`).once('value');
  const lic = snap.val();
  if (!lic || lic.status !== 'aktywny') fail('Licencja nieaktywna lub nie istnieje.', 'failed-precondition');
  if (lic.wygasa && lic.wygasa <= Date.now()) fail('Licencja wygasła.', 'failed-precondition');
  return lic;
}

function normalizeName(raw) {
  return String(raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function parseTeamId(raw) {
  if (raw === 0 || raw === '0') return 0;
  const n = parseInt(raw, 10);
  if (!isNaN(n) && String(n) === String(raw).trim()) return n;
  const s = String(raw || '').trim();
  if (!s) fail('Brak teamId.');
  return s;
}

function findTeam(state, teamId) {
  const teams = state.teams || [];
  return teams.find((t) => t && String(t.id) === String(teamId)) || null;
}

function syncTeamEverywhere(state, teamId, patch) {
  const apply = (obj) => {
    if (!obj || String(obj.id) !== String(teamId)) return;
    Object.keys(patch).forEach((k) => {
      obj[k] = patch[k];
    });
  };
  (state.teams || []).forEach(apply);
  if (state.groups) {
    Object.keys(state.groups).forEach((gn) => (state.groups[gn] || []).forEach(apply));
  }
  (state.matches || []).forEach((m) => {
    apply(m.t1);
    apply(m.t2);
  });
  (state.playoffs || []).forEach((m) => {
    apply(m.t1);
    apply(m.t2);
  });
}

async function verifyCaptainToken(db, key, teamId, token) {
  const snap = await db.ref(`kapitanowie/${key}/${teamId}`).once('value');
  const data = snap.val();
  if (!data || !data.token || data.token !== token) {
    fail('Nieprawidłowy token kapitana.', 'permission-denied');
  }
  if (data.expiresAt && data.expiresAt <= Date.now()) {
    fail('Link kapitana wygasł — poproś organizatora o nowy.', 'permission-denied');
  }
  return data;
}

function getTeamParams(state) {
  const tp = (state.settings && state.settings.teamParams) || {};
  return {
    players: !!tp.players,
    captain: !!tp.captain,
    gk: !!tp.gk,
  };
}

function sanitizePlayers(rawList) {
  if (!Array.isArray(rawList)) fail('Lista zawodników jest wymagana.');
  if (rawList.length < 1 || rawList.length > CAPTAIN_ROSTER_MAX) {
    fail(`Skład musi mieć od 1 do ${CAPTAIN_ROSTER_MAX} zawodników.`);
  }
  const seen = new Set();
  const players = [];
  rawList.forEach((row, idx) => {
    const name = normalizeName(row && row.name);
    if (!name) fail(`Zawodnik #${idx + 1}: wpisz imię i nazwisko.`);
    if (seen.has(name)) fail(`Duplikat zawodnika: ${name}`);
    seen.add(name);
    let number = null;
    if (row && row.number !== undefined && row.number !== null && String(row.number).trim() !== '') {
      const n = parseInt(row.number, 10);
      if (isNaN(n) || n < 0 || n > 99) fail(`Numer zawodnika ${name} musi być 0–99.`);
      number = n;
    }
    const id = String((row && row.id) || `p_${crypto.randomBytes(4).toString('hex')}`);
    const out = { id, name };
    if (number !== null) out.number = number;
    players.push(out);
  });
  return players;
}

function sanitizeBio(raw, label) {
  const s = String(raw || '').trim();
  if (s.length > BIO_MAX) fail(`${label}: max ${BIO_MAX} znaków.`);
  return s;
}

function buildPayload(body) {
  const name = normalizeName(body && body.name);
  if (!name) fail('Podaj nazwę drużyny.');
  const players = sanitizePlayers(body && body.players);
  const ids = new Set(players.map((p) => p.id));
  const gkId = body && body.gkId ? String(body.gkId) : null;
  const capId = body && body.capId ? String(body.capId) : null;
  if (!gkId || !ids.has(gkId)) fail('Wybierz bramkarza spośród zawodników.');
  if (!capId || !ids.has(capId)) fail('Wybierz kapitana spośród zawodników.');
  const gk = players.find((p) => p.id === gkId).name;
  const cap = players.find((p) => p.id === capId).name;
  const photoUrl = String((body && body.photoUrl) || '').trim() || null;
  if (photoUrl && !/^https:\/\//i.test(photoUrl)) fail('Nieprawidłowy adres zdjęcia.');
  return {
    name,
    teamNote: sanitizeBio(body && body.teamNote, 'Opis drużyny'),
    captainBio: sanitizeBio(body && body.captainBio, 'O kapitanie'),
    photoUrl,
    players,
    gkId,
    capId,
    gk,
    cap,
  };
}

async function generateCaptainToken(db, key, teamIdRaw, noteEmail) {
  const lic = await assertActiveLicense(db, key);
  const teamId = parseTeamId(teamIdRaw);
  const path = `turnieje_uzytkownikow/${key}`;
  const snap = await db.ref(path).once('value');
  const state = snap.val() || {};
  if (state.meta && state.meta.tournamentClosed) {
    fail('Turniej jest zamknięty — nie można generować zaproszeń.', 'failed-precondition');
  }
  const team = findTeam(state, teamId);
  if (!team) fail('Nie znaleziono drużyny.', 'not-found');

  const now = Date.now();
  const token = generateToken();
  const expiresAt = Math.min(lic.wygasa || now + INVITE_MAX_MS, now + INVITE_MAX_MS);
  const invite = {
    token,
    createdAt: now,
    expiresAt,
    teamId,
  };
  const email = String(noteEmail || '').trim();
  if (email) invite.noteEmail = email.slice(0, 120);

  await db.ref(`kapitanowie/${key}/${teamId}`).set(invite);

  syncTeamEverywhere(state, teamId, { captainInviteStatus: 'invited' });
  await db.ref(`${path}/teams`).set(state.teams || []);
  if (state.groups) await db.ref(`${path}/groups`).set(state.groups);
  if (state.matches) await db.ref(`${path}/matches`).set(state.matches);
  if (state.playoffs) await db.ref(`${path}/playoffs`).set(state.playoffs);

  return { token, expiresAt, teamId };
}

async function revokeCaptainToken(db, key, teamIdRaw) {
  await assertActiveLicense(db, key);
  const teamId = parseTeamId(teamIdRaw);
  await db.ref(`kapitanowie/${key}/${teamId}`).remove();
  return { ok: true };
}

async function getCaptainForm(db, payload) {
  const key = String(payload?.key || '').trim();
  const token = String(payload?.token || '').trim();
  const teamId = parseTeamId(payload?.teamId);
  if (!key || !token) fail('Brak klucza lub tokenu.');

  await assertActiveLicense(db, key);
  await verifyCaptainToken(db, key, teamId, token);

  const snap = await db.ref(`turnieje_uzytkownikow/${key}`).once('value');
  const state = snap.val() || {};
  if (state.meta && state.meta.tournamentClosed) {
    fail('Turniej jest zamknięty.', 'failed-precondition');
  }
  const team = findTeam(state, teamId);
  if (!team) fail('Nie znaleziono drużyny.', 'not-found');

  const teamParams = getTeamParams(state);
  if (!teamParams.players) {
    fail('Organizator nie zbiera składów zawodników w tym turnieju.', 'failed-precondition');
  }

  const subSnap = await db.ref(`turnieje_uzytkownikow/${key}/captainSubmissions/${teamId}`).once('value');
  const submission = subSnap.val() || null;

  const tournamentName =
    (state.meta && state.meta.tournamentName) ||
    (state.settings && state.settings.tournamentName) ||
    '';

  return {
    rosterMax: CAPTAIN_ROSTER_MAX,
    bioMax: BIO_MAX,
    tournamentName,
    requireGk: true,
    requireCaptain: true,
    teamParams: {
      players: true,
      captain: true,
      gk: true,
    },
    team: {
      id: team.id,
      name: team.name || '',
      players: Array.isArray(team.players) ? team.players : [],
      gkId: team.gkId || null,
      capId: team.capId || null,
      teamNote: team.teamNote || '',
      captainBio: team.captainBio || '',
      photoUrl: team.photoUrl || null,
    },
    submission: submission
      ? {
          status: submission.status || 'none',
          rejectReason: submission.rejectReason || '',
          submittedAt: submission.submittedAt || null,
          payload: submission.payload || null,
        }
      : { status: 'none' },
  };
}

async function submitCaptainRoster(db, payload) {
  const key = String(payload?.key || '').trim();
  const token = String(payload?.token || '').trim();
  const teamId = parseTeamId(payload?.teamId);
  if (!key || !token) fail('Brak klucza lub tokenu.');

  await assertActiveLicense(db, key);
  await verifyCaptainToken(db, key, teamId, token);

  const path = `turnieje_uzytkownikow/${key}`;
  const snap = await db.ref(path).once('value');
  const state = snap.val() || {};
  if (state.meta && state.meta.tournamentClosed) {
    fail('Turniej jest zamknięty.', 'failed-precondition');
  }
  const team = findTeam(state, teamId);
  if (!team) fail('Nie znaleziono drużyny.', 'not-found');

  const teamParams = getTeamParams(state);
  if (!teamParams.players) {
    fail('Organizator nie zbiera składów zawodników w tym turnieju.', 'failed-precondition');
  }

  const roster = buildPayload(payload);
  const now = Date.now();
  const submission = {
    status: 'pending',
    submittedAt: now,
    reviewedAt: null,
    rejectReason: null,
    payload: roster,
  };

  syncTeamEverywhere(state, teamId, { captainInviteStatus: 'pending' });
  if (!state.logs) state.logs = [];
  const time = new Date().toLocaleTimeString('pl-PL');
  state.logs.push(`[${time}] Kapitan zgłosił skład: ${roster.name} (${roster.players.length} zaw.).`);
  if (state.logs.length > 50) state.logs.shift();

  await db.ref(`${path}/captainSubmissions/${teamId}`).set(submission);
  await db.ref(`${path}/teams`).set(state.teams || []);
  if (state.groups) await db.ref(`${path}/groups`).set(state.groups);
  if (state.matches) await db.ref(`${path}/matches`).set(state.matches);
  if (state.playoffs) await db.ref(`${path}/playoffs`).set(state.playoffs);
  await db.ref(`${path}/logs`).set(state.logs);

  return { ok: true, status: 'pending' };
}

async function uploadCaptainTeamPhoto(db, payload) {
  const key = String(payload?.key || '').trim();
  const token = String(payload?.token || '').trim();
  const teamId = parseTeamId(payload?.teamId);
  const dataUrl = String(payload?.dataUrl || '').trim();
  if (!key || !token || !dataUrl) fail('Brak danych zdjęcia.');

  await assertActiveLicense(db, key);
  await verifyCaptainToken(db, key, teamId, token);

  const m = dataUrl.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/i);
  if (!m) fail('Zdjęcie musi być JPEG lub PNG (data URL).');
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length || buffer.length > PHOTO_MAX_BYTES) {
    fail('Zdjęcie jest za duże (max ok. 400 KB po kompresji).');
  }

  const downloadToken = generateToken();
  const objectPath = `captain-photos/${key}/${teamId}/team.jpg`;
  const bucket = admin.storage().bucket();
  const file = bucket.file(objectPath);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=3600',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const photoUrl =
    'https://firebasestorage.googleapis.com/v0/b/' +
    encodeURIComponent(bucket.name) +
    '/o/' +
    encodeURIComponent(objectPath) +
    '?alt=media&token=' +
    downloadToken;

  return { ok: true, photoUrl };
}

async function acceptCaptainRoster(db, payload) {
  const key = String(payload?.key || '').trim();
  const teamId = parseTeamId(payload?.teamId);
  if (!key) fail('Brak klucza.');

  await assertActiveLicense(db, key);
  const path = `turnieje_uzytkownikow/${key}`;
  const snap = await db.ref(path).once('value');
  const state = snap.val() || {};
  if (state.meta && state.meta.tournamentClosed) {
    fail('Turniej jest zamknięty.', 'failed-precondition');
  }
  const team = findTeam(state, teamId);
  if (!team) fail('Nie znaleziono drużyny.', 'not-found');

  const subPath = `${path}/captainSubmissions/${teamId}`;
  const subSnap = await db.ref(subPath).once('value');
  const submission = subSnap.val();
  if (!submission || submission.status !== 'pending' || !submission.payload) {
    fail('Brak zgłoszenia oczekującego na akceptację.', 'failed-precondition');
  }

  const p = submission.payload;
  const patch = {
    name: p.name,
    players: p.players || [],
    gkId: p.gkId || null,
    capId: p.capId || null,
    gk: p.gk || '',
    cap: p.cap || '',
    teamNote: p.teamNote || '',
    captainBio: p.captainBio || '',
    photoUrl: p.photoUrl || null,
    captainInviteStatus: 'accepted',
  };
  syncTeamEverywhere(state, teamId, patch);

  if (!state.settings) state.settings = {};
  if (!state.settings.teamParams || typeof state.settings.teamParams !== 'object') {
    state.settings.teamParams = { players: true, captain: true, gk: true, squadSize: 7 };
  } else {
    state.settings.teamParams.players = true;
    state.settings.teamParams.captain = true;
    state.settings.teamParams.gk = true;
    if (!state.settings.teamParams.squadSize) state.settings.teamParams.squadSize = 7;
  }

  const now = Date.now();
  submission.status = 'accepted';
  submission.reviewedAt = now;
  submission.rejectReason = null;

  if (!state.logs) state.logs = [];
  const time = new Date().toLocaleTimeString('pl-PL');
  state.logs.push(`[${time}] Zaakceptowano skład kapitana: ${p.name}.`);
  if (state.logs.length > 50) state.logs.shift();

  const { active, archiwum, wstrzymane, ...toSave } = state;
  await db.ref(`${path}/teams`).set(toSave.teams || []);
  if (toSave.groups) await db.ref(`${path}/groups`).set(toSave.groups);
  if (toSave.matches) await db.ref(`${path}/matches`).set(toSave.matches);
  if (toSave.playoffs) await db.ref(`${path}/playoffs`).set(toSave.playoffs);
  await db.ref(`${path}/logs`).set(toSave.logs || []);
  await db.ref(`${path}/settings`).set(toSave.settings || state.settings);
  await db.ref(subPath).set(submission);

  return { ok: true, status: 'accepted' };
}

async function rejectCaptainRoster(db, payload) {
  const key = String(payload?.key || '').trim();
  const teamId = parseTeamId(payload?.teamId);
  const reason = sanitizeBio(payload?.reason, 'Powód odrzucenia');
  if (!key) fail('Brak klucza.');

  await assertActiveLicense(db, key);
  const path = `turnieje_uzytkownikow/${key}`;
  const snap = await db.ref(path).once('value');
  const state = snap.val() || {};
  if (state.meta && state.meta.tournamentClosed) {
    fail('Turniej jest zamknięty.', 'failed-precondition');
  }

  const subPath = `${path}/captainSubmissions/${teamId}`;
  const subSnap = await db.ref(subPath).once('value');
  const submission = subSnap.val();
  if (!submission || submission.status !== 'pending') {
    fail('Brak zgłoszenia oczekującego na decyzję.', 'failed-precondition');
  }

  submission.status = 'rejected';
  submission.reviewedAt = Date.now();
  submission.rejectReason = reason || 'Popraw skład i wyślij ponownie.';

  syncTeamEverywhere(state, teamId, { captainInviteStatus: 'rejected' });
  const { active, archiwum, wstrzymane, ...toSave } = state;
  if (!toSave.logs) toSave.logs = [];
  const time = new Date().toLocaleTimeString('pl-PL');
  toSave.logs.push(`[${time}] Odrzucono skład kapitana (drużyna #${teamId}).`);
  if (toSave.logs.length > 50) toSave.logs.shift();

  await db.ref(`${path}/teams`).set(toSave.teams || []);
  if (toSave.groups) await db.ref(`${path}/groups`).set(toSave.groups);
  if (toSave.matches) await db.ref(`${path}/matches`).set(toSave.matches);
  if (toSave.playoffs) await db.ref(`${path}/playoffs`).set(toSave.playoffs);
  await db.ref(`${path}/logs`).set(toSave.logs);
  await db.ref(subPath).set(submission);

  return { ok: true, status: 'rejected' };
}

module.exports = {
  CAPTAIN_ROSTER_MAX,
  generateCaptainToken,
  revokeCaptainToken,
  getCaptainForm,
  submitCaptainRoster,
  uploadCaptainTeamPhoto,
  acceptCaptainRoster,
  rejectCaptainRoster,
};
