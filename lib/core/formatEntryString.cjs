function formatEntryString(entryString) {
  // 去掉首尾空格，去除中间的多个空格，因为在html中多个空格会被解析为一个空格，对显示效果没有影响，这样可以保证同一个词条内容不会因为有多个空格而被解析为多个词条
  // \n \t \r这类字符也会被解析为一个空格
  return entryString.trim().replace(/\s+/g, ' ');
}

const EXTRACT_IGNORED_COMMENT = 'i18n-tool-extract-ignored';

function isExtractIgnore(astNode) {
  if (astNode.leadingComments) {
    const ignored = astNode.leadingComments.some(comment => {
      if (comment.type === 'CommentBlock' && comment.value.trim() === EXTRACT_IGNORED_COMMENT) {
        return true;
      }
      return false;
    });
    return ignored;
  }
  return false;
}

module.exports = {
  formatEntryString,
  isExtractIgnore
};
