const { regexMatchChinese } = require('../../utils/string/regexMatchChinese.cjs');

const styleFile = {
  test(absolutePath) {
    return /\.(css|scss|sass|less)$/.test(absolutePath);
  },
  async check(absolutePath, content) {
    return regexMatchChinese(content);
  }
};

module.exports = { styleFile };
