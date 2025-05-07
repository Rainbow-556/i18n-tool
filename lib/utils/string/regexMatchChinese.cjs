function regexMatchChinese(str) {
  return str.match(/[\u4e00-\u9fa5]+/g) || [];
}

module.exports = { regexMatchChinese };
