const { KEY_RE, buildActivationUpdate } = require('./keys');

async function activateLicenseByKey(db, key, options = {}) {
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

  const forceNewPeriod = options.forceNewPeriod === true;
  const now = Date.now();

  if (lic.status === 'zablokowany' && !forceNewPeriod) {
    const err = new Error('Licencja jest zablokowana. Odblokuj ją przed aktywacją.');
    err.code = 'failed-precondition';
    throw err;
  }

  if (lic.status === 'aktywny' && lic.wygasa && lic.wygasa > now) {
    return { ok: true, alreadyActive: true, key, wygasa: lic.wygasa };
  }

  const everActivated = lic.everActivated === true || !!lic.aktywowany;
  const isExpired = everActivated && lic.wygasa && lic.wygasa <= now;
  const isNeverActivated = !everActivated && lic.status === 'nowy';

  if (isNeverActivated) {
    const update = buildActivationUpdate(lic.typ, now);
    await ref.update(update);
    return { ok: true, key, firstActivation: true, ...update };
  }

  if (forceNewPeriod && everActivated) {
    const update = buildActivationUpdate(lic.typ, now);
    await ref.update({ ...update, _preBlock: null });
    return { ok: true, key, grantedNewPeriod: true, ...update };
  }

  if (everActivated) {
    const err = new Error(
      isExpired
        ? 'Licencja wygasła. Użyj +24H w monitorze lub jawnej akcji „Nowy okres”.'
        : 'Licencja była już aktywowana — pierwsza aktywacja nie jest możliwa.',
    );
    err.code = 'failed-precondition';
    throw err;
  }

  const update = buildActivationUpdate(lic.typ, now);
  await ref.update(update);
  return { ok: true, key, firstActivation: true, ...update };
}

module.exports = { activateLicenseByKey };
