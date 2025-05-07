function containsChinese(str) {
  // 使用Unicode范围检测中文
  return /[\u4e00-\u9fa5]/.test(str);
}

module.exports = { containsChinese };
