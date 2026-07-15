/**
 * Anulowanie zamówienia po nieudanej płatności (np. BLIK async_payment_failed).
 * Blokuje licencję, jeśli została wcześniej wydana.
 */
async function handlePaymentFailure(db, session) {
  const paymentId = session.id;
  const orderSnap = await db.ref('zamowienia/' + paymentId).once('value');
  const order = orderSnap.val();

  if (!order) {
    console.log('Payment failed — brak zamówienia:', paymentId, session.payment_status);
    return { ok: true, skipped: true };
  }

  await db.ref('zamowienia/' + paymentId).update({
    status: 'payment_failed',
    paymentStatus: session.payment_status || 'failed',
    paymentFailedAt: Date.now(),
  });

  if (order.licenseKey) {
    const licRef = db.ref('licencje/' + order.licenseKey);
    const licSnap = await licRef.once('value');
    if (licSnap.val()) {
      const prev = licSnap.val().notatka || '';
      const tag = '[Płatność nieudana]';
      await licRef.update({
        status: 'zablokowany',
        notatka: prev.includes(tag) ? prev : `${prev} ${tag}`.trim(),
      });
    }
  }

  console.log('Payment failed — zamówienie anulowane:', paymentId, order.licenseKey || '—');
  return { ok: true, paymentId, licenseKey: order.licenseKey || null };
}

module.exports = { handlePaymentFailure };
