// import { a } from '@/fileFormat/js.js';
const { a } = require('@/fileFormat/js.js');

function generateKey(str) {
  return '来自.cjs' + str + a;
}

console.log('.cjs', generateKey('hello'));

module.exports = { generateKey };
