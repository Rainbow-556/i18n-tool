const styleFile = {
  test(absolutePath) {
    return /\.(css|scss|sass|less)$/.test(absolutePath);
  },
  async check(absolutePath, content) {
    return content.match(/[\u4e00-\u9fa5]+/g) || [];
  }
};

module.exports = {
  styleFile
};
