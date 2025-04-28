const { a } = require('@/fileFormat/js.js');
// const i18nObj = require('@/i18n/index.js');
// const { fake } = require('@/i18n/index.js');
// const { fake, i18n: i18n_200 } = require('@/i18n/index.js');

function generateKey(str) {
  return '来自.cjs' + str + a;
}

// console.log('.cjs', generateKey('hello'));

module.exports = { generateKey };
