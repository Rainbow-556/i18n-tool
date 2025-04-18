const { vue2Compiler } = require('./vue2.cjs');
const { vue3Compiler } = require('./vue3.cjs');
const { jsonCompiler } = require('./json.cjs');

// todo 支持.ts、.tsx、.jsx
// .js、.cjs、.mjs无需编译，直接返回即可
const compilers = [vue2Compiler, vue3Compiler, jsonCompiler];

function compileToJS(absolutePath, content) {
  const compiler = compilers.find(compiler => compiler.test(absolutePath));
  if (compiler) {
    return compiler.compile(content);
  }
  return [content];
}

module.exports = {
  compileToJS
};
