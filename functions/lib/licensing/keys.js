const KEY_RE = /^TP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function durationMs(typ) {
  if (typ === 'weekend') return 72 * 60 * 60 * 1000;
  if (typ === 'miesiac') return 30 * 24 * 60 * 60 * 1000;
  if (typ === 'unlimited') return 99 * 365 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function buildActivationUpdate(typ, now) {
  return {
    status: 'aktywny',
    aktywowany: now,
    wygasa: now + durationMs(typ),
  };
}

function generateLicenseKey() {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) part1 += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
  for (let i = 0; i < 4; i++) part2 += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
  return `TP-${part1}-${part2}`;
}

module.exports = {
  KEY_RE,
  durationMs,
  buildActivationUpdate,
  generateLicenseKey,
};
