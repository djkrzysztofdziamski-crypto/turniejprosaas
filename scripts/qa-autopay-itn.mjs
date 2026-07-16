#!/usr/bin/env node
/**
 * QA Autopay: hash startu + parse ITN + struktura confirmationList (docs).
 * Uruchom: node scripts/qa-autopay-itn.mjs
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const __dir = dirname(fileURLToPath(import.meta.url));
const { autopayHash } = require(join(__dir, '../functions/lib/billing/autopay/hash.js'));
const {
  parseItnTransactionListXml,
  buildItnConfirmationXml,
} = require(join(__dir, '../functions/lib/billing/autopay/xml.js'));

function sanitizeAutopayDescription(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[—–−]/g, '-')
    .replace(/[^A-Za-z0-9.:,\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 79);
}

let failed = 0;
function check(label, ok, detail = '') {
  console.log(ok ? '✅' : '❌', label, detail ? `— ${detail}` : '');
  if (!ok) failed += 1;
}

const DOC_HASH = '2ab52e6918c6ad3b69a8228a2ab815f11ad58533eeed963dd990df8d8c3709d1';
check('hash start (docs)', autopayHash(['2', '100', '1.50'], '2test2') === DOC_HASH);

const itnXml = `<?xml version="1.0" encoding="UTF-8"?>
<transactionList>
  <serviceID>217795</serviceID>
  <transactions>
    <transaction>
      <orderID>TPTESTORDER01</orderID>
      <remoteID>REMOTE99</remoteID>
      <amount>79.00</amount>
      <currency>PLN</currency>
      <gatewayID>150</gatewayID>
      <paymentDate>20260716120000</paymentDate>
      <paymentStatus>SUCCESS</paymentStatus>
      <paymentStatusDetails>AUTHORIZED</paymentStatusDetails>
    </transaction>
  </transactions>
  <hash>abc123hash</hash>
</transactionList>`;

const tx = parseItnTransactionListXml(itnXml);
check('ITN parse serviceID (list)', tx?.serviceID === '217795');
check('ITN parse hash (list)', tx?.hash === 'abc123hash');
check('ITN parse orderID', tx?.orderID === 'TPTESTORDER01');
check('ITN parse amount', tx?.amount === '79.00');
check('ITN parse status', tx?.paymentStatus === 'SUCCESS');

const confHash = autopayHash(['217795', 'TPTESTORDER01', 'CONFIRMED'], 'secret');
const confXml = buildItnConfirmationXml({
  serviceID: '217795',
  orderID: 'TPTESTORDER01',
  confirmation: 'CONFIRMED',
  hash: confHash,
});
check('confirmationList ma serviceID', confXml.includes('<serviceID>217795</serviceID>'));
check('confirmationList ma transactionsConfirmations', confXml.includes('<transactionsConfirmations>'));
check('confirmationList ma transactionConfirmed', confXml.includes('<transactionConfirmed>'));
check('confirmationList hash na poziomie listy', /<\/transactionsConfirmations><hash>/.test(confXml.replace(/\s+/g, '')));
check('brak starego wrappera <confirmation>', !/<confirmationList>\s*<confirmation>/.test(confXml));

const desc = sanitizeAutopayDescription('Turniejomat — Pakiet weekendowy — piłka nożna');
check('Description bez em-dash/PL', /^[A-Za-z0-9.:,\- ]+$/.test(desc) && !desc.includes('—'));
check('Description max 79', desc.length <= 79);

// Spójność: hash ITN z pól w kolejności docs
const key = '2test2';
const itnFields = ['2', '100', 'RID1', '1.50', 'PLN', '3', '20200101120000', 'SUCCESS', 'OK'];
const itnHash = createHash('sha256').update(itnFields.join('|') + '|' + key, 'utf8').digest('hex');
check('hash ITN kolejność pól', autopayHash(itnFields, key) === itnHash);

console.log('\n===', failed ? `FAIL ${failed}` : 'OK', '===');
process.exit(failed ? 1 : 0);
