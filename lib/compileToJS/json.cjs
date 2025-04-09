const jsonCompiler = {
  test(absolutePath) {
    return /\.json$/.test(absolutePath);
  },
  compile(content) {
    return [`const json = ${content}`];
  }
};

module.exports = {
  jsonCompiler
};
