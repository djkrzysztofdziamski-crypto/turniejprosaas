const { KEY_RE, buildActivationUpdate } = require('./keys');

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

module.exports = { activateLicenseByKey };
