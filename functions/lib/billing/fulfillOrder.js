const { getProduct } = require('./catalog');
const { createAndActivateLicense } = require('../licensing');
const { sendLicenseEmail } = require('./email');

/**
 * Zamknięcie pętli sprzedaży: produkt → licencja → zamówienie → email.
 */
async function fulfillOrder(db, order) {
  const {
    productId,
    notatka,
    source,
    paymentId,
    customerEmail,
  } = order;

  const result = await createAndActivateLicense(db, {
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

  let emailResult = { sent: false, reason: 'skipped' };
  if (customerEmail) {
    try {
      emailResult = await sendLicenseEmail({
        to: customerEmail,
        licenseKey: result.key,
        productLabel,
        expiresAt: result.wygasa,
      });
    } catch (err) {
      console.error('sendLicenseEmail failed:', err.message);
      emailResult = { sent: false, reason: err.message };
    }
  }

  if (paymentId) {
    await db.ref('zamowienia/' + paymentId).update({
      emailSent: emailResult.sent === true,
      emailError: emailResult.sent ? null : (emailResult.reason || 'unknown'),
      emailSentAt: emailResult.sent ? Date.now() : null,
    });
  }

  return { ...result, email: emailResult };
}

module.exports = { fulfillOrder };
