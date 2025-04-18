function generateKey(str) {
  return '来自.cjs' + str;
}

console.log('.cjs', generateKey('hello'));
