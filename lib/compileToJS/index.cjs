const { jsCompiler } = require('./js.cjs');
const { vue2Compiler } = require('./vue2.cjs');
const { vue3Compiler } = require('./vue3.cjs');
const { jsonCompiler } = require('./json.cjs');

const compilers = [jsCompiler, vue2Compiler, vue3Compiler, jsonCompiler];

function compileToJS(absolutePath, content) {
  const compiler = compilers.find(compiler => compiler.test(absolutePath));
  if (compiler) {
    try {
      return [null, compiler.compile(content)];
    } catch (e) {
      return [e];
    }
  }
  return [new Error(`不支持的文件类型: ${absolutePath}`)];
}

module.exports = {
  compileToJS
};
