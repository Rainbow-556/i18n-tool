const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const postcssLess = require('postcss-less');
const { containsChinese } = require('../../utils/string/containsChinese.cjs');

const styleFile = {
  test(absolutePath) {
    return /\.(css|scss|sass|less)$/.test(absolutePath);
  },
  async check(absolutePath, content) {
    // scss、less中使用到了import、include等语法，处理复杂，考虑到样式文件中一般不会有中文，所以不使用该方式
    const results = [];
    // 根据文件类型选择语法解析器
    const syntax =
      absolutePath.endsWith('.scss') || absolutePath.endsWith('.sass')
        ? postcssScss
        : absolutePath.endsWith('.less')
        ? postcssLess
        : null; // CSS 文件无需特殊语法
    // 解析为 AST
    // const root = postcss.parse(content, { syntax });
    const { root } = await postcss().process(content, {
      // !! 关键步骤：指定解析器为 postcss-scss
      parser: postcssScss,
      from: absolutePath
    });
    // 遍历 AST 节点
    root.walkDecls(decl => {
      if (containsChinese(decl.value)) {
        console.log(`[文件] ${absolutePath} | [中文] ${decl.value.trim()}`);
        results.push(decl.value.trim());
      }
    });

    // 可选：遍历注释节点（如 /* 中文注释 */）
    root.walkComments(comment => {
      if (decl.value(comment.text)) {
        console.log(`[文件] ${absolutePath} | [注释] ${comment.text.trim()}`);
        results.push(comment.text.trim());
      }
    });
    console.log(results);
    return results;
  }
};

module.exports = { styleFile };
