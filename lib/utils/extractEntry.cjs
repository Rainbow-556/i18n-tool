const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { containsChinese } = require('./containsChinese.cjs');
const { generateKey } = require('./generateKey.cjs');
const { formatEntryString, isExtractIgnore } = require('../core/formatEntryString.cjs');

const EXTRACT_IGNORED_COMMENT = 'i18n-tool-extract-ignored';

function extractEntry(code) {
  const entries = {};
  const ignoredEntries = [];

  const ast = parse(code, {
    configFile: false,
    // 自动检测模式，当代码中包含 import 或 export 语句时，按 "module" 模式解析，否则按 "script" 模式解析，用于解决有些不确定js文件使用的模块类型
    sourceType: 'unambiguous',
    // 保留注释
    attachComment: true
    // plugins: ['jsx', 'typescript'] // 支持JSX和TS
  });

  traverse(ast, {
    StringLiteral(path) {
      const value = formatEntryString(path.node.value);
      if (containsChinese(value)) {
        if (isExtractIgnore(path.node)) {
          ignoredEntries.push(value);
          return;
        }
        const key = generateKey(value);
        // 把\n去掉，百度翻译接口是以\n作为分隔符多个待翻译文本
        entries[key] = value.replace(/\n/g, '');
      }
    },
    TemplateLiteral(path) {
      // 静态部分
      const { quasis } = path.node;
      // 拼接原始模板字符串（用{index}占位动态部分）
      const staticStrArr = quasis.map(q => q.value.cooked);
      let templateStr = staticStrArr[0];
      for (let i = 1; i < staticStrArr.length; i++) {
        templateStr = templateStr + `{p${i - 1}}` + staticStrArr[i];
      }
      templateStr = formatEntryString(templateStr);

      if (containsChinese(templateStr)) {
        if (isExtractIgnore(path.node)) {
          ignoredEntries.push(templateStr);
          return;
        }
        const key = generateKey(templateStr);
        // 把\n去掉，百度翻译接口是以\n作为分隔符多个待翻译文本
        entries[key] = templateStr.replace(/\n/g, '');
      }
    }
  });
  return { entries, ignoredEntries };
}

module.exports = {
  extractEntry
};
