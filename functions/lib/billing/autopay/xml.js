/**
 * Autopay ITN XML — parse + confirmation (zgodnie z developers.autopay.pl).
 *
 * ITN request (Base64 → XML):
 *   <transactionList>
 *     <serviceID>…</serviceID>
 *     <transactions><transaction>…</transaction></transactions>
 *     <hash>…</hash>
 *   </transactionList>
 *
 * ITN response:
 *   <confirmationList>
 *     <serviceID>…</serviceID>
 *     <transactionsConfirmations>
 *       <transactionConfirmed>
 *         <orderID>…</orderID>
 *         <confirmation>CONFIRMED|NOTCONFIRMED</confirmation>
 *       </transactionConfirmed>
 *     </transactionsConfirmations>
 *     <hash>…</hash>
 *   </confirmationList>
 */

function readXmlTag(xml, tag) {
  if (!xml) return '';
  const re = new RegExp('<' + tag + '>([^<]*)</' + tag + '>', 'i');
  const m = String(xml).match(re);
  return m ? m[1].trim() : '';
}

function parseItnTransactionXml(xml) {
  return {
    serviceID: readXmlTag(xml, 'serviceID') || readXmlTag(xml, 'ServiceID'),
    orderID: readXmlTag(xml, 'orderID') || readXmlTag(xml, 'OrderID'),
    remoteID: readXmlTag(xml, 'remoteID') || readXmlTag(xml, 'RemoteID'),
    amount: readXmlTag(xml, 'amount') || readXmlTag(xml, 'Amount'),
    currency: readXmlTag(xml, 'currency') || readXmlTag(xml, 'Currency'),
    gatewayID: readXmlTag(xml, 'gatewayID') || readXmlTag(xml, 'GatewayID'),
    paymentDate: readXmlTag(xml, 'paymentDate') || readXmlTag(xml, 'PaymentDate'),
    paymentStatus: readXmlTag(xml, 'paymentStatus') || readXmlTag(xml, 'PaymentStatus'),
    paymentStatusDetails: readXmlTag(xml, 'paymentStatusDetails') || readXmlTag(xml, 'PaymentStatusDetails'),
    hash: readXmlTag(xml, 'hash') || readXmlTag(xml, 'Hash'),
    startAmount: readXmlTag(xml, 'startAmount') || readXmlTag(xml, 'StartAmount'),
  };
}

/**
 * Parsuje pełny dokument transactionList (serviceID + hash na poziomie listy).
 */
function parseItnTransactionListXml(xml) {
  const full = String(xml || '');
  const listServiceID = readXmlTag(full, 'serviceID') || readXmlTag(full, 'ServiceID');
  const listHash = readXmlTag(full, 'hash') || readXmlTag(full, 'Hash');

  const txMatch = full.match(/<transaction\b[\s\S]*?<\/transaction>/i);
  if (!txMatch) return null;

  const tx = parseItnTransactionXml(txMatch[0]);
  return {
    ...tx,
    serviceID: listServiceID || tx.serviceID,
    hash: listHash || tx.hash,
  };
}

function buildItnConfirmationXml({ serviceID, orderID, confirmation, hash }) {
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<confirmationList>' +
    '<serviceID>' + escapeXml(serviceID) + '</serviceID>' +
    '<transactionsConfirmations>' +
    '<transactionConfirmed>' +
    '<orderID>' + escapeXml(orderID) + '</orderID>' +
    '<confirmation>' + escapeXml(confirmation) + '</confirmation>' +
    '</transactionConfirmed>' +
    '</transactionsConfirmations>' +
    '<hash>' + escapeXml(hash) + '</hash>' +
    '</confirmationList>';
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  readXmlTag,
  parseItnTransactionXml,
  parseItnTransactionListXml,
  buildItnConfirmationXml,
};
