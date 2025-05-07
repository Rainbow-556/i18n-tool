const { createHash } = require('crypto');

function generateKey(str) {
  return createHash('md5').update(str).digest('hex');
}

module.exports = { generateKey };
