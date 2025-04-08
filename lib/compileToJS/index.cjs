const { vue3Compiler } = require('./vue3.cjs');

const compilers = [vue3Compiler];

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
