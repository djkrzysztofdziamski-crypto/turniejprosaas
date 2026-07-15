const crypto = require('crypto');

/**
 * Autopay hash: SHA256(pole1|pole2|...|poleN|klucz_współdzielony)
 * Puste opcjonalne pola pomijamy (bez separatora).
 */
function autopayHash(fieldValues, sharedKey) {
  const parts = (fieldValues || []).filter((v) => v != null && String(v) !== '');
  const payload = parts.join('|') + '|' + String(sharedKey || '');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function verifyAutopayHash(fieldValues, sharedKey, expectedHash) {
  if (!expectedHash) return false;
  const calc = autopayHash(fieldValues, sharedKey);
  return calc.toLowerCase() === String(expectedHash).toLowerCase();
}

module.exports = { autopayHash, verifyAutopayHash };
