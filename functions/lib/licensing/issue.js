const { getProduct, resolveProductId } = require('../billing/catalog');
const { buildActivationUpdate, generateLicenseKey } = require('./keys');

async function createAndActivateLicense(db, options) {
  const {
    productId: rawProductId,
    typ,
    notatka,
    source,
    paymentId,
    customerEmail,
  } = options;

  if (paymentId) {
    const existing = await db.ref('zamowienia/' + paymentId).once('value');
    if (existing.val()) {
      return {
        ok: true,
        key: existing.val().licenseKey,
        alreadyProcessed: true,
        productId: existing.val().productId,
        typ: existing.val().typ,
        email: existing.val().customerEmail || null,
      };
    }
  }

  const resolvedProductId = resolveProductId({ productId: rawProductId, typ });
  const product = getProduct(resolvedProductId);
  if (!product) {
    const err = new Error('Nieznany produkt: ' + resolvedProductId);
    err.code = 'invalid-argument';
    throw err;
  }

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

  const activation = buildActivationUpdate(product.typ, now);
  const payload = {
    typ: product.typ,
    productId: product.id,
    sports: product.sports,
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
      productId: product.id,
      typ: product.typ,
      sports: product.sports,
      status: 'completed',
      createdAt: now,
      notatka: payload.notatka,
      customerEmail: customerEmail || null,
      emailSent: false,
    });
  }

  return {
    ok: true,
    key,
    productId: product.id,
    sports: product.sports,
    customerEmail: customerEmail || null,
    ...activation,
    typ: product.typ,
  };
}

module.exports = { createAndActivateLicense };
