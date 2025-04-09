const { vue2Compiler } = require('./vue2.cjs');
const { vue3Compiler } = require('./vue3.cjs');
const { jsCompiler } = require('./js.cjs');
const { jsonCompiler } = require('./json.cjs');

// todo 支持ts、tsx、jsx
const compilers = [vue2Compiler, vue3Compiler, jsCompiler, jsonCompiler];

function compileToJS(absolutePath, content) {
  const compiler = compilers.find(compiler => compiler.test(absolutePath));
  // const compiler = vue2Compiler;
  if (compiler) {
    return compiler.compile(content);
  }
  return [content];
}

module.exports = {
  compileToJS
};
