const crypto = require('crypto');
const { getProduct } = require('../catalog');
const { autopayHash, verifyAutopayHash } = require('../autopay/hash');
const { parseItnTransactionListXml, buildItnConfirmationXml } = require('../autopay/xml');
const { savePendingCheckout, loadPendingCheckout, markPendingCheckout } = require('../pendingCheckout');
const {
  getAutopayServiceId,
  getAutopaySharedKey,
  getAutopayGatewayUrl,
} = require('../../params');

function formatAmountPln(grosze) {
  return (grosze / 100).toFixed(2);
}

function generateOrderId() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const id = 'TP' + Date.now().toString(36).toUpperCase() + rand;
  return id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
}

/**
 * Description Autopay: tylko A-Z a-z 0-9 oraz . : - , spacja (max 79).
 */
function sanitizeAutopayDescription(text) {
  const map = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
    Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
  };
  return String(text || '')
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => map[ch] || ch)
    .replace(/[—–−]/g, '-')
    .replace(/[^A-Za-z0-9.:,\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 79);
}

function buildStartHash({ serviceID, orderID, amount, customerEmail, description, currency }) {
  const fields = [serviceID, orderID, amount];
  if (description) fields.push(description);
  // GatewayID omitted
  if (currency) fields.push(currency);
  fields.push(customerEmail);
  return autopayHash(fields, getAutopaySharedKey());
}

async function createAutopayPayment(db, { productId, customerEmail, termsVersion, termsAccepted, withdrawalConsent }) {
  const serviceID = getAutopayServiceId();
  const sharedKey = getAutopaySharedKey();
  const gatewayUrl = getAutopayGatewayUrl();

  if (!serviceID || !sharedKey) {
    const err = new Error('Autopay nie jest skonfigurowany (AUTOPAY_SERVICE_ID, AUTOPAY_SHARED_KEY).');
    err.code = 'failed-precondition';
    throw err;
  }

  const product = getProduct(productId);
  if (!product || !product.active) {
    const err = new Error('Nieznany lub nieaktywny produkt.');
    err.code = 'invalid-argument';
    throw err;
  }

  const orderID = generateOrderId();
  const amount = formatAmountPln(product.priceGrosze);
  const description = sanitizeAutopayDescription('Turniejomat - ' + (product.label || product.id));
  const hash = buildStartHash({
    serviceID,
    orderID,
    amount,
    customerEmail,
    description,
    currency: 'PLN',
  });

  await savePendingCheckout(db, orderID, {
    productId: product.id,
    customerEmail: customerEmail || null,
    amount,
    currency: 'PLN',
    provider: 'autopay',
    termsAccepted: termsAccepted === true,
    withdrawalConsent: withdrawalConsent === true,
    termsVersion: termsVersion || null,
    termsAcceptedAt: Date.now(),
  });

  return {
    provider: 'autopay',
    method: 'POST',
    url: gatewayUrl.replace(/\/$/, ''),
    orderId: orderID,
    fields: {
      ServiceID: serviceID,
      OrderID: orderID,
      Amount: amount,
      Description: description,
      Currency: 'PLN',
      CustomerEmail: customerEmail,
      Hash: hash,
    },
  };
}

function verifyItnHash(tx) {
  const fields = [
    tx.serviceID,
    tx.orderID,
    tx.remoteID,
    tx.amount,
    tx.currency,
    tx.gatewayID,
    tx.paymentDate,
    tx.paymentStatus,
    tx.paymentStatusDetails,
  ];
  return verifyAutopayHash(fields, getAutopaySharedKey(), tx.hash);
}

function buildItnResponse(tx, confirmed) {
  const confirmation = confirmed ? 'CONFIRMED' : 'NOTCONFIRMED';
  const hash = autopayHash([tx.serviceID, tx.orderID, confirmation], getAutopaySharedKey());
  return buildItnConfirmationXml({
    serviceID: tx.serviceID,
    orderID: tx.orderID,
    confirmation,
    hash,
  });
}

function parseAutopayItnBody(body) {
  const transactionsB64 = body?.transactions || body?.Transactions;
  if (!transactionsB64) return null;
  let xml;
  try {
    xml = Buffer.from(String(transactionsB64), 'base64').toString('utf8');
  } catch (_) {
    return null;
  }
  return parseItnTransactionListXml(xml);
}

async function handleAutopayItn(db, req, fulfillOrder, handlePaymentFailure) {
  const tx = parseAutopayItnBody(req.body || {});
  if (!tx || !tx.orderID) {
    return { status: 400, body: 'Invalid ITN payload' };
  }

  const configuredServiceId = getAutopayServiceId();
  if (configuredServiceId && tx.serviceID && String(tx.serviceID) !== String(configuredServiceId)) {
    console.error('Autopay ITN serviceID mismatch', tx.serviceID, configuredServiceId);
    return {
      status: 200,
      contentType: 'application/xml; charset=UTF-8',
      body: buildItnResponse(tx, false),
    };
  }

  const hashOk = verifyItnHash(tx);
  if (!hashOk) {
    console.error('Autopay ITN hash mismatch', tx.orderID);
    return {
      status: 200,
      contentType: 'application/xml; charset=UTF-8',
      body: buildItnResponse(tx, false),
    };
  }

  const pending = await loadPendingCheckout(db, tx.orderID);
  if (!pending) {
    console.warn('Autopay ITN unknown order', tx.orderID);
    return {
      status: 200,
      contentType: 'application/xml; charset=UTF-8',
      body: buildItnResponse(tx, false),
    };
  }

  // Idempotencja: już zrealizowane — CONFIRMED bez ponownego fulfill
  if (pending.status === 'completed') {
    return {
      status: 200,
      contentType: 'application/xml; charset=UTF-8',
      body: buildItnResponse(tx, true),
    };
  }

  const expectedAmount = pending.amount;
  const amountOk = !expectedAmount || String(tx.amount) === String(expectedAmount) ||
    String(tx.startAmount) === String(expectedAmount);

  // Model uproszczony Autopay: potwierdzaj ITN gdy hash + kwota OK (także PENDING/FAILURE)
  let confirmed = hashOk && amountOk;

  try {
    if (tx.paymentStatus === 'SUCCESS' && confirmed) {
      const product = getProduct(pending.productId);
      const email = pending.customerEmail || '';
      const notatka = email
        ? `Autopay: ${email} (${product?.label || pending.productId})`
        : `Autopay: ${product?.label || pending.productId}`;

      const result = await fulfillOrder(db, {
        productId: pending.productId,
        notatka,
        source: 'autopay',
        paymentId: tx.orderID,
        customerEmail: email || null,
      });

      confirmed = result.alreadyProcessed || confirmed;

      await markPendingCheckout(db, tx.orderID, {
        status: 'completed',
        remoteID: tx.remoteID || null,
        paymentStatus: tx.paymentStatus,
      });
    } else if (tx.paymentStatus === 'FAILURE') {
      // Nie anuluj wcześniejszego SUCCESS (inny RemoteID) — tu pending jeszcze nie completed
      await markPendingCheckout(db, tx.orderID, {
        status: 'failed',
        remoteID: tx.remoteID || null,
        paymentStatus: tx.paymentStatus,
      });
      if (typeof handlePaymentFailure === 'function') {
        await handlePaymentFailure(db, {
          id: tx.orderID,
          customer_email: pending.customerEmail,
          metadata: { productId: pending.productId },
        });
      }
    } else {
      // PENDING i inne — tylko zapis statusu; odpowiedź CONFIRMED jeśli autentyczne
      await markPendingCheckout(db, tx.orderID, {
        status: String(tx.paymentStatus || 'pending').toLowerCase(),
        remoteID: tx.remoteID || null,
        paymentStatus: tx.paymentStatus,
      });
    }
  } catch (err) {
    console.error('Autopay ITN handler error:', err.message);
    confirmed = false;
  }

  return {
    status: 200,
    contentType: 'application/xml; charset=UTF-8',
    body: buildItnResponse(tx, confirmed),
  };
}

module.exports = {
  createAutopayPayment,
  handleAutopayItn,
  buildStartHash,
  verifyItnHash,
  parseAutopayItnBody,
  formatAmountPln,
  sanitizeAutopayDescription,
};
