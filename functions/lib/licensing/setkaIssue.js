const { createPrivateKey, sign } = require('crypto');
const { getProduct, resolveProductId } = require('../billing/catalog');

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function ymdPlusDays(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function createSetkaToken(privateKeyPem, payloadObj) {
  const privateKey = createPrivateKey(privateKeyPem);
  const payloadBytes = Buffer.from(JSON.stringify(payloadObj), 'utf8');
  const sig = sign(null, payloadBytes, privateKey);
  return 'SETKA1.' + b64url(payloadBytes) + '.' + b64url(sig);
}

function maskToken(token) {
  const raw = String(token || '');
  if (raw.length < 20) return raw;
  return raw.slice(0, 12) + '…' + raw.slice(-8);
}

async function createAndActivateSetkaLicense(db, options) {
  const {
    productId: rawProductId,
    notatka,
    source,
    paymentId,
    customerEmail,
    privateKeyPem,
  } = options;

  if (!privateKeyPem) {
    const err = new Error('Brak klucza prywatnego SETKA (SETKA_LICENSE_PRIVATE_KEY_PEM).');
    err.code = 'failed-precondition';
    throw err;
  }

  if (!paymentId) {
    const err = new Error('Brak paymentId dla issuance SETKA.');
    err.code = 'invalid-argument';
    throw err;
  }

  const existingOrderSnap = await db.ref('zamowienia/' + paymentId).once('value');
  const existingOrder = existingOrderSnap.val();
  if (existingOrder && existingOrder.licenseKey) {
    return {
      ok: true,
      key: existingOrder.licenseKey,
      alreadyProcessed: true,
      productId: existingOrder.productId,
      typ: existingOrder.typ || null,
      until: existingOrder.until || null,
      customerEmail: existingOrder.customerEmail || null,
      app: 'setka',
    };
  }

  const resolvedProductId = resolveProductId({ productId: rawProductId, app: 'setka' });
  const product = getProduct(resolvedProductId);
  if (!product || product.app !== 'setka') {
    const err = new Error('Nieznany produkt SETKA: ' + resolvedProductId);
    err.code = 'invalid-argument';
    throw err;
  }

  const days = Number(product.days || 0);
  if (!Number.isFinite(days) || days < 1) {
    const err = new Error('Produkt SETKA nie ma poprawnie ustawionego czasu licencji.');
    err.code = 'failed-precondition';
    throw err;
  }

  const now = Date.now();
  const until = ymdPlusDays(days);
  const payloadObj = {
    v: 1,
    until: until,
    id: String(paymentId).slice(0, 64),
    iat: Math.floor(now / 1000),
  };

  const token = createSetkaToken(privateKeyPem, payloadObj);
  const note = notatka || 'Zamówienie online SETKA';
  const provider = source || 'autopay';

  await db.ref('licencje_setka/' + paymentId).set({
    app: 'setka',
    paymentId,
    productId: product.id,
    typ: product.typ,
    days,
    until,
    token,
    tokenMasked: maskToken(token),
    customerEmail: customerEmail || null,
    provider,
    status: 'active',
    issuedAt: now,
    notatka: note,
  });

  await db.ref('zamowienia/' + paymentId).set({
    app: 'setka',
    provider,
    paymentId,
    licenseKey: token,
    licenseKeyMasked: maskToken(token),
    productId: product.id,
    typ: product.typ,
    sports: product.sports,
    until,
    status: 'completed',
    createdAt: now,
    notatka: note,
    customerEmail: customerEmail || null,
    emailSent: false,
  });

  return {
    ok: true,
    key: token,
    keyMasked: maskToken(token),
    productId: product.id,
    sports: product.sports,
    customerEmail: customerEmail || null,
    typ: product.typ,
    until,
    app: 'setka',
  };
}

module.exports = { createAndActivateSetkaLicense, maskToken };
