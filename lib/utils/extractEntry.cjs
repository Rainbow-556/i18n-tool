const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { containsChinese } = require('./containsChinese.cjs');
const { generateKey } = require('./generateKey.cjs');

function extractEntry(code) {
  const zhEntry = {};

  const ast = parse(code, {
    configFile: false,
    // 自动检测模式，当代码中包含 import 或 export 语句时，按 "module" 模式解析，否则按 "script" 模式解析，用于解决有些不确定js文件使用的模块类型
    sourceType: 'unambiguous'
    // plugins: ['jsx', 'typescript'] // 支持JSX和TS
  });

  traverse(ast, {
    StringLiteral(path) {
      const { value } = path.node;
      if (containsChinese(value)) {
        // todo 是否要trim
        const key = generateKey(value);
        zhEntry[key] = value;
      }
    },
    TemplateLiteral(path) {
      // 静态部分
      const quasis = path.node.quasis;
      // 拼接原始模板字符串（用{index}占位动态部分）
      // todo 是否要trim
      const staticStrArr = quasis.map(q => q.value.cooked);
      let templateStr = staticStrArr[0];
      for (let i = 1; i < staticStrArr.length; i++) {
        templateStr = templateStr + `{p${i - 1}}` + staticStrArr[i];
      }
      if (containsChinese(templateStr)) {
        const md5 = generateKey(templateStr);
        zhEntry[md5] = templateStr;
      }
    }
  });
  return zhEntry;
}

module.exports = {
  extractEntry
};
