function pendingRef(db, orderId) {
  return db.ref('platnosci_oczekujace/' + orderId);
}

async function savePendingCheckout(db, orderId, data) {
  await pendingRef(db, orderId).set({
    ...data,
    orderId,
    status: 'pending',
    createdAt: Date.now(),
  });
}

async function loadPendingCheckout(db, orderId) {
  const snap = await pendingRef(db, orderId).once('value');
  return snap.val() || null;
}

async function markPendingCheckout(db, orderId, patch) {
  await pendingRef(db, orderId).update({
    ...patch,
    updatedAt: Date.now(),
  });
}

module.exports = {
  savePendingCheckout,
  loadPendingCheckout,
  markPendingCheckout,
};
