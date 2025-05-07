const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { containsChinese } = require('../../utils/string/containsChinese.cjs');
const { generateKey } = require('./generateKey.cjs');
const { formatEntryString } = require('../entry/formatEntryString.cjs');
const { isExtractIgnored } = require('../entry/isExtractIgnored.cjs');

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
        if (isExtractIgnored(path.node)) {
          ignoredEntries.push(value);
          return;
        }
        const key = generateKey(value);
        entries[key] = value;
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
        if (isExtractIgnored(path.node)) {
          ignoredEntries.push(templateStr);
          return;
        }
        const key = generateKey(templateStr);
        entries[key] = templateStr;
      }
    }
  });
  return { entries, ignoredEntries };
}

module.exports = { extractEntry };
