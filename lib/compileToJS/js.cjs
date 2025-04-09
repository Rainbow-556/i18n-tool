const jsCompiler = {
  test(absolutePath) {
    return /\.js$/.test(absolutePath);
  },
  compile(content) {
    return [content];
  }
};

module.exports = {
  jsCompiler
};
