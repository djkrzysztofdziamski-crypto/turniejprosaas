/**
 * Turniejomat — Cloud Functions
 * - activateLicense: aktywacja klucza (admin / przyszły webhook płatności)
 * - paymentWebhook: placeholder pod Stripe / Przelewy24
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const KEY_RE = /^TP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

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

/**
 * Callable — tylko admin (auth.token.admin === true).
 * Użycie z panelu admina po podłączeniu firebase.functions().httpsCallable('activateLicense').
 */
exports.activateLicense = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Wymagane uprawnienia administratora.');
  }

  const key = String(data?.key || '').trim();
  if (!KEY_RE.test(key)) {
    throw new functions.https.HttpsError('invalid-argument', 'Niepoprawny format klucza licencyjnego.');
  }

  const ref = admin.database().ref('licencje/' + key);
  const snap = await ref.once('value');
  const lic = snap.val();
  if (!lic) {
    throw new functions.https.HttpsError('not-found', 'Licencja nie istnieje.');
  }
  if (lic.status === 'zablokowany') {
    throw new functions.https.HttpsError('failed-precondition', 'Licencja jest zablokowana.');
  }
  if (lic.status === 'aktywny' && lic.wygasa && lic.wygasa > Date.now()) {
    return { ok: true, alreadyActive: true, key, wygasa: lic.wygasa };
  }

  const now = Date.now();
  const update = buildActivationUpdate(lic.typ, now);
  await ref.update(update);
  return { ok: true, key, ...update };
});

/**
 * HTTP — docelowo webhook Stripe / Przelewy24.
 * Na razie zwraca 501; podłączenie po wyborze PSP.
 */
exports.paymentWebhook = functions.region('europe-west1').https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(501).json({
    error: 'Not implemented',
    message: 'Podłącz Stripe lub Przelewy24 — aktywacja licencji po weryfikacji podpisu webhook.',
  });
});
