const { vue3Compiler } = require('./vue3.cjs');
const { vue2Compiler } = require('./vue2.cjs');

const compilers = [vue2Compiler, vue3Compiler];

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
