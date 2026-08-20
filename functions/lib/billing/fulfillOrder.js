const { getProduct } = require('./catalog');
const { createAndActivateLicense } = require('../licensing');
const { createAndActivateSetkaLicense } = require('../licensing/setkaIssue');
const { sendLicenseEmail } = require('./email');
const { getSetkaLicensePrivateKeyPem, getSetkaUrls } = require('../params');

/**
 * Zamknięcie pętli sprzedaży: produkt → licencja → zamówienie → email.
 */
async function fulfillOrder(db, order) {
  const {
    app,
    productId,
    notatka,
    source,
    paymentId,
    customerEmail,
  } = order;

  const targetApp = String(app || '').trim().toLowerCase() || (String(productId || '').startsWith('setka-') ? 'setka' : 'turniejomat');
  const result = targetApp === 'setka'
    ? await createAndActivateSetkaLicense(db, {
      productId,
      notatka,
      source,
      paymentId,
      customerEmail,
      privateKeyPem: getSetkaLicensePrivateKeyPem(),
    })
    : await createAndActivateLicense(db, {
      productId,
      notatka,
      source,
      paymentId,
      customerEmail,
    });

  if (result.alreadyProcessed) {
    return result;
  }

  const product = getProduct(result.productId);
  const productLabel = product?.label || result.productId;
  const isSetka = targetApp === 'setka';
  const setkaUrls = getSetkaUrls();

  let emailResult = { sent: false, reason: 'skipped' };
  if (customerEmail) {
    try {
      emailResult = await sendLicenseEmail({
        to: customerEmail,
        licenseKey: result.key,
        productLabel,
        expiresAt: result.wygasa || (result.until ? Date.parse(result.until + 'T23:59:59.999Z') : null),
        validityText: result.validityText || null,
        app: isSetka ? {
          id: 'setka',
          name: 'SETKA',
          appUrl: setkaUrls.appUrl,
          supportEmail: 'admin@turniejomat.pl',
          ctaLabel: 'Uruchom SETKĘ',
        } : null,
      });
    } catch (err) {
      console.error('sendLicenseEmail failed:', err.message);
      emailResult = { sent: false, reason: err.message };
    }
  }

  if (paymentId) {
    await db.ref('zamowienia/' + paymentId).update({
      app: targetApp,
      emailSent: emailResult.sent === true,
      emailError: emailResult.sent ? null : (emailResult.reason || 'unknown'),
      emailSentAt: emailResult.sent ? Date.now() : null,
    });
  }

  return { ...result, email: emailResult };
}

module.exports = { fulfillOrder };
