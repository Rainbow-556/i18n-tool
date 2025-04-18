const { a } = require('@/fileFormat/js.js');

function generateKey(str) {
  return '来自.cjs' + str;
}

console.log('.cjs', a, generateKey('hello'));

module.exports = {
  generateKey
};
