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

function buildItnConfirmationXml({ serviceID, orderID, confirmation, hash }) {
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<confirmationList>' +
    '<confirmation>' +
    '<serviceID>' + escapeXml(serviceID) + '</serviceID>' +
    '<orderID>' + escapeXml(orderID) + '</orderID>' +
    '<confirmation>' + escapeXml(confirmation) + '</confirmation>' +
    '<hash>' + escapeXml(hash) + '</hash>' +
    '</confirmation>' +
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
  parseItnTransactionXml,
  buildItnConfirmationXml,
};
