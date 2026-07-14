const KEY_RE = /^TP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function durationMs(typ) {
  if (typ === 'weekend') return 72 * 60 * 60 * 1000;
  if (typ === 'miesiac') return 30 * 24 * 60 * 60 * 1000;
  if (typ === 'unlimited') return 99 * 365 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function buildActivationUpdate(typ, now) {
  return {
    status: 'aktywny',
    aktywowany: now,
    wygasa: now + durationMs(typ),
  };
}

function generateLicenseKey() {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) part1 += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
  for (let i = 0; i < 4; i++) part2 += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
  return `TP-${part1}-${part2}`;
}

async function activateLicenseByKey(db, key) {
  if (!KEY_RE.test(key)) {
    const err = new Error('Niepoprawny format klucza licencyjnego.');
    err.code = 'invalid-argument';
    throw err;
  }

  const ref = db.ref('licencje/' + key);
  const snap = await ref.once('value');
  const lic = snap.val();
  if (!lic) {
    const err = new Error('Licencja nie istnieje.');
    err.code = 'not-found';
    throw err;
  }
  if (lic.status === 'zablokowany') {
    const err = new Error('Licencja jest zablokowana.');
    err.code = 'failed-precondition';
    throw err;
  }
  if (lic.status === 'aktywny' && lic.wygasa && lic.wygasa > Date.now()) {
    return { ok: true, alreadyActive: true, key, wygasa: lic.wygasa };
  }

  const now = Date.now();
  const update = buildActivationUpdate(lic.typ, now);
  await ref.update(update);
  return { ok: true, key, ...update };
}

async function createAndActivateLicense(db, { typ, notatka, source, paymentId }) {
  if (paymentId) {
    const existing = await db.ref('zamowienia/' + paymentId).once('value');
    if (existing.val()) {
      return {
        ok: true,
        key: existing.val().licenseKey,
        alreadyProcessed: true,
        typ: existing.val().typ,
      };
    }
  }

  const packageTyp = typ === 'miesiac' ? 'miesiac' : 'weekend';
  const now = Date.now();
  const nowStr = new Date(now).toLocaleString('pl-PL');
  let key = generateLicenseKey();
  let attempts = 0;

  while (attempts < 8) {
    const exists = await db.ref('licencje/' + key).once('value');
    if (!exists.val()) break;
    key = generateLicenseKey();
    attempts++;
  }

  const activation = buildActivationUpdate(packageTyp, now);
  const payload = {
    typ: packageTyp,
    status: activation.status,
    stworzony: nowStr,
    aktywowany: activation.aktywowany,
    wygasa: activation.wygasa,
    notatka: notatka || 'Zamówienie online',
  };

  await db.ref('licencje/' + key).set(payload);

  if (paymentId) {
    await db.ref('zamowienia/' + paymentId).set({
      provider: source || 'stripe',
      paymentId,
      licenseKey: key,
      typ: packageTyp,
      status: 'completed',
      createdAt: now,
      notatka: payload.notatka,
    });
  }

  return { ok: true, key, ...activation, typ: packageTyp };
}

module.exports = {
  KEY_RE,
  durationMs,
  buildActivationUpdate,
  generateLicenseKey,
  activateLicenseByKey,
  createAndActivateLicense,
};
