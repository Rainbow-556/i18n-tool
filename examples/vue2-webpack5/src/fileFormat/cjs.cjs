const { a } = require('@/fileFormat/js.js');

function generateKey(str) {
  return '来自.cjs a=' + a + 'str' + str;
}

module.exports = {
  generateKey
};
