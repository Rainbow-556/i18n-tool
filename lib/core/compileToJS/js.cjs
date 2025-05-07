const jsCompiler = {
  test(absolutePath) {
    return /\.(js|cjs|mjs)$/.test(absolutePath);
  },
  compile(content) {
    return [content];
  }
};

module.exports = { jsCompiler };
