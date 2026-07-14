const { getProduct } = require('./catalog');
const { sendLicenseEmail } = require('./email');

async function resendOrderEmail(db, paymentId) {
  const orderSnap = await db.ref('zamowienia/' + paymentId).once('value');
  const order = orderSnap.val();
  if (!order) {
    const err = new Error('Zamówienie nie istnieje.');
    err.code = 'not-found';
    throw err;
  }

  const email = order.customerEmail;
  if (!email) {
    const err = new Error('Brak adresu email w zamówieniu.');
    err.code = 'failed-precondition';
    throw err;
  }

  const licenseKey = order.licenseKey;
  if (!licenseKey) {
    const err = new Error('Brak klucza licencyjnego w zamówieniu.');
    err.code = 'failed-precondition';
    throw err;
  }

  let wygasa = null;
  const licSnap = await db.ref('licencje/' + licenseKey).once('value');
  if (licSnap.val()?.wygasa) wygasa = licSnap.val().wygasa;

  const product = getProduct(order.productId);
  const productLabel = product?.label || order.productId || order.typ || 'Turniejomat';

  const emailResult = await sendLicenseEmail({
    to: email,
    licenseKey,
    productLabel,
    expiresAt: wygasa,
  });

  await db.ref('zamowienia/' + paymentId).update({
    emailSent: emailResult.sent === true,
    emailError: emailResult.sent ? null : (emailResult.reason || 'unknown'),
    emailSentAt: emailResult.sent ? Date.now() : null,
  });

  return { paymentId, licenseKey, email, ...emailResult };
}

module.exports = { resendOrderEmail };
