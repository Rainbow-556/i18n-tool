function formatEntryString(entryString) {
  // 去掉首尾空格，去除中间的多个空格，因为在html中多个空格会被解析为一个空格，对显示效果没有影响，这样可以保证同一个词条内容不会因为有多个空格而被解析为多个词条
  return entryString.trim().replace(/\s+/g, ' ');
}

module.exports = {
  formatEntryString
};
