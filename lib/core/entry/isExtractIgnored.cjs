const EXTRACT_IGNORED_COMMENT = 'i18n-tool-extract-ignored';

function isExtractIgnored(astNode) {
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

module.exports = { EXTRACT_IGNORED_COMMENT, isExtractIgnored };
