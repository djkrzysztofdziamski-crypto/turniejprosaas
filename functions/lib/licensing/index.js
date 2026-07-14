const { KEY_RE, durationMs, buildActivationUpdate, generateLicenseKey } = require('./keys');
const { activateLicenseByKey } = require('./activate');
const { createAndActivateLicense } = require('./issue');

module.exports = {
  KEY_RE,
  durationMs,
  buildActivationUpdate,
  generateLicenseKey,
  activateLicenseByKey,
  createAndActivateLicense,
};
