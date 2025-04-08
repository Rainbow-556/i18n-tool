const { parse } = require('@babel/parser'); // Babel解析器
const traverse = require('@babel/traverse').default; // AST遍历器
const { containsChinese } = require('./containsChinese.cjs');
const { generateKey } = require('./generateKey.cjs');

function extractEntry(code) {
  const ast = parse(code, {
    sourceType: 'module'
    // plugins: ['jsx', 'typescript'] // 支持JSX和TS
  });
  const zhMap = {};
  traverse(ast, {
    StringLiteral(path) {
      const { value } = path.node;
      if (containsChinese(value)) {
        // todo 是否要trim
        const key = generateKey(value);
        zhMap[key] = value;
      }
    },
    TemplateLiteral(path) {
      // 静态部分
      const quasis = path.node.quasis;
      // 拼接原始模板字符串（用{index}占位动态部分）
      // todo 是否要trim
      let staticStrArr = quasis.map(q => q.value.cooked);
      let templateStr = staticStrArr[0];
      for (let i = 1; i < staticStrArr.length; i++) {
        templateStr = templateStr + `{${i - 1}}` + staticStrArr[i];
      }
      if (containsChinese(templateStr)) {
        const md5 = generateKey(templateStr);
        zhMap[md5] = templateStr;
      }
    }
  });
  return zhMap;
}

module.exports = {
  extractEntry
};
