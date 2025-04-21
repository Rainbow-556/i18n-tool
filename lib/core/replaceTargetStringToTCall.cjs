const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { containsChinese } = require('../utils/containsChinese.cjs');
const { generateKey } = require('../utils/generateKey.cjs');
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { entryChecker } = require('../core/entryChecker.cjs');
const path = require('path');

/**
 * 将目标文件中的中文字符串替换为i18nFramework.t()
 * @param {object} options
 * @param {string} options.buildTool 构建工具，可选值：'webpack' | 'vite'
 * @param {string} options.filePath 待处理文件的绝对路径
 * @param {string} options.source 待处理文件的源码
 * @returns
 */
async function replaceTargetStringToTCall({ buildTool, filePath, source }) {
  await codeFormatter.init();
  const formattedCode = codeFormatter.format(source);
  const { code } = transformCode({
    buildTool,
    filePath,
    code: formattedCode
  });
  return { code };
}

function transformCode({ buildTool, filePath, code }) {
  const ast = parse(code, {
    // 因为babel会查找.babelrc文件，此处无需查找配置文件
    configFile: false,
    // 自动判断js的模块类型
    sourceType: 'unambiguous'
  });

  // 遍历是否有中文
  let hasChinese = false;
  traverse(ast, {
    StringLiteral(path) {
      const { value } = path.node;
      if (containsChinese(value)) {
        hasChinese = true;
        path.stop();
      }
    },
    TemplateLiteral(path) {
      // 静态部分
      const { quasis } = path.node;
      if (quasis.some(q => containsChinese(q.value.cooked))) {
        hasChinese = true;
        path.stop();
      }
    }
  });

  if (!hasChinese) {
    // console.log('\n没有中文，忽略', filePath, '\n');
    return { code };
  }

  // 判断是否已经导入i18nToolConfig.i18nAlias
  let i18nFrameworkLocalName;
  if (ast.program.sourceType === 'script') {
    // cjs模块
    i18nFrameworkLocalName = autoRequireI18nForCJS({ filePath, ast });
  } else {
    // esm模块
    i18nFrameworkLocalName = autoImportI18nForESM({ buildTool, filePath, ast });
  }

  // 把字符串字面量和模板字符串替换为i18nFramework.t()
  traverse(ast, {
    // 处理字符串字面量
    StringLiteral(path) {
      // todo 待处理字符串中含有html标签的情况、字符串中url中文编码的情况
      handleStringLiteral({ path, i18nFrameworkLocalName });
    },
    // 处理模板字符串
    TemplateLiteral(path) {
      handleTemplateLiteral({ path, i18nFrameworkLocalName });
    }
  });

  // 将AST转回代码
  return generate(ast);
}

function handleStringLiteral({ path, i18nFrameworkLocalName }) {
  const value = path.node.value.trim();
  if (!containsChinese(value)) {
    return;
  }

  // console.log('StringLiteral', value);

  const key = generateKey(value);
  if (entryChecker.collectMissingEntry({ key, content: value })) {
    return;
  }

  const tCall = t.callExpression(t.memberExpression(t.identifier(i18nFrameworkLocalName), t.identifier('t')), [
    t.stringLiteral(key)
  ]);
  path.replaceWith(tCall);
}

function handleTemplateLiteral({ path, i18nFrameworkLocalName }) {
  // 静态部分
  const {
    // 静态部分
    quasis,
    // 动态表达式
    expressions
  } = path.node;
  // 拼接原始模板字符串（用{p + index}占位动态部分）
  const staticStrArr = quasis.map(q => q.value.cooked);
  let templateStr = staticStrArr[0];
  for (let i = 1; i < staticStrArr.length; i++) {
    templateStr = templateStr + `{p${i - 1}}` + staticStrArr[i];
  }
  templateStr = templateStr.trim();

  if (!containsChinese(templateStr)) {
    return;
  }

  // console.log('TemplateLiteral', templateStr);

  const key = generateKey(templateStr);
  if (entryChecker.collectMissingEntry({ key, content: templateStr })) {
    return;
  }

  // 创建参数对象：{ p0: a, p1: b } 形式
  const params = expressions.map((exp, i) => t.objectProperty(t.stringLiteral(`p${i}`), exp));
  const tCall = t.callExpression(t.memberExpression(t.identifier(i18nFrameworkLocalName), t.identifier('t')), [
    t.stringLiteral(key),
    t.objectExpression(params)
  ]);
  path.replaceWith(tCall);
}

function autoImportI18nForESM({ buildTool, filePath, ast }) {
  let importFound = false;
  let i18nFrameworkLocalName = `i18nFramework_${Date.now()}`;

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === i18nToolConfig.i18nAlias) {
        importFound = true;
        let i18nFrameworkImported = false;
        for (const specifier of path.node.specifiers) {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: 'i18nFramework' })) {
            i18nFrameworkLocalName = specifier.local.name;
            i18nFrameworkImported = true;
            break;
          }
        }
        // 如果没有找到 i18nFramework 的导入，需要插入一个新的导入
        if (!i18nFrameworkImported) {
          path.node.specifiers.push(
            t.importSpecifier(t.identifier(i18nFrameworkLocalName), t.identifier('i18nFramework'))
          );
        }
        path.stop();
      }
    }
  });

  if (!importFound) {
    // i18nToolConfig.i18nAlias 没有导入，需要在顶部插入 import
    traverse(ast, {
      Program(astPath) {
        let importPath;
        if (filePath.endsWith('.json') && buildTool === 'vite') {
          // vite插件在json转换成js的产物代码中，导入语句只能是使用相对路径，否则会报错。json的js产物中必然是没有import语句，所以在此处插入即可
          importPath = getRelativePath(filePath, path.resolve(i18nToolConfig.i18nDir, 'index.js'));
        } else {
          importPath = i18nToolConfig.i18nAlias;
        }
        astPath.node.body.unshift(
          t.importDeclaration(
            [t.importSpecifier(t.identifier(i18nFrameworkLocalName), t.identifier('i18nFramework'))],
            t.stringLiteral(importPath)
          )
        );
        astPath.stop();
      }
    });
  }
  return i18nFrameworkLocalName;
}

function autoRequireI18nForCJS({ filePath, ast }) {
  let importFound = false;
  let i18nFrameworkLocalName = `i18nFramework_${Date.now()}`;

  // 遍历AST，查找是否存在目标 require 语句或相关引入
  traverse(ast, {
    // 访问 VariableDeclaration 节点 (例如: const a = 1;, var b = 2;, let c = 3;)
    VariableDeclaration(path) {
      // 确保当前节点是在 Program 节点下 (即全局作用域)
      if (path.parent.type !== 'Program') {
        return;
      }

      // 遍历当前 VariableDeclaration 中的所有 Declarator (例如: const a = 1, b = 2;)
      for (const declarator of path.node.declarations) {
        // 检查 Declarator 的初始化部分 (init) 是否是 CallExpression (即函数调用)
        // 并检查调用的函数是否是 identifier 且名称为 'require'
        if (t.isCallExpression(declarator.init) && t.isIdentifier(declarator.init.callee, { name: 'require' })) {
          // 检查 require 调用是否有参数，并且第一个参数是 StringLiteral (即模块路径)
          const requireArg = declarator.init.arguments[0];
          if (requireArg && t.isStringLiteral(requireArg)) {
            const modulePath = requireArg.value;
            // 检查 require 的模块路径是否是目标路径之一
            if (i18nToolConfig.i18nAlias === modulePath) {
              importFound = true;
              // 找到了从目标模块的 require 调用，现在检查是如何引入的
              // 检查 Declarator 的 id (声明的变量部分)
              if (t.isObjectPattern(declarator.id)) {
                let i18nFrameworkImported = false;
                // Case 1: 是 ObjectPattern (即 { ... } 解构)
                // 遍历解构的属性
                for (const property of declarator.id.properties) {
                  // 只处理 ObjectProperty (例如: { a, b: c })，忽略 RestElement ({ ...rest })
                  if (t.isObjectProperty(property)) {
                    // 检查属性的 key (即模块导出的属性名) 是否是 Identifier 或 StringLiteral 且名称/值为 'i18nFramework'
                    // 这是为了匹配 { i18nFramework } (key 是 identifier) 和 { 'i18nFramework': renamed } (key 是 string literal)
                    if (t.isIdentifier(property.key, { name: 'i18nFramework' })) {
                      // 找到了通过解构引入了 i18nFramework (无论是否重命名)
                      i18nFrameworkImported = true;
                      i18nFrameworkLocalName = property.value.name;
                      break;
                    }
                  }
                }
                if (!i18nFrameworkImported) {
                  // 如果解构中没有找到 i18nFramework，则将其添加到解构中
                  declarator.id.properties.push(
                    t.objectProperty(
                      t.identifier('i18nFramework'), // key: i18nFramework (模块导出的属性名)
                      t.identifier(i18nFrameworkLocalName), // value: i18nFramework (本地变量名)
                      false, // computed: false (不是计算属性名)
                      true // shorthand: true ({ i18nFramework } 是简写形式)
                    )
                  );
                }
                path.stop();
              } else if (t.isIdentifier(declarator.id)) {
                // Case 2: 是 Identifier (即 const wholeObj = require(...) )
                // 这表示整个模块对象都被引入了
                const i18nObjLocalName = declarator.id.name;
                // 创建新的 const { i18nFramework: i18nFrameworkLocalName } = i18nObjLocalName; 节点，并插入到当前 VariableDeclaration 之后
                const newNode = t.variableDeclaration('const', [
                  // const
                  t.variableDeclarator(
                    // Declarator
                    t.objectPattern([
                      // { i18nFramework } 解构
                      t.objectProperty(
                        t.identifier('i18nFramework'), // key: i18nFramework (模块导出的属性名)
                        t.identifier(i18nFrameworkLocalName), // value: i18nFramework (本地变量名)
                        false, // computed: false (不是计算属性名)
                        true // shorthand: true ({ i18nFramework } 是简写形式)
                      )
                    ]),
                    t.identifier(i18nObjLocalName)
                  )
                ]);
                // 在当前 VariableDeclaration 之后插入新的 VariableDeclaration
                path.insertAfter(newNode);
                path.stop();
              }
            }
          }
        }
      }
    }
  });

  if (!importFound) {
    // 创建需要添加的 AST 节点: const { i18nFramework } = require('@/i18n/index.js');
    const newNode = t.variableDeclaration('const', [
      // const
      t.variableDeclarator(
        // Declarator
        t.objectPattern([
          // { i18nFramework } 解构
          t.objectProperty(
            t.identifier('i18nFramework'), // key: i18nFramework (模块导出的属性名)
            t.identifier(i18nFrameworkLocalName), // value: i18nFramework (本地变量名)
            false, // computed: false (不是计算属性名)
            true // shorthand: true ({ i18nFramework } 是简写形式)
          )
        ]),
        t.callExpression(
          // = require(...) 调用
          t.identifier('require'), // require 函数
          [t.stringLiteral(i18nToolConfig.i18nAlias)] // 参数: 模块路径
        )
      )
    ]);

    // 再次遍历AST，找到 Program 节点，并将新节点插入到文件顶部
    traverse(ast, {
      Program(path) {
        path.node.body.unshift(newNode);
        path.stop();
      }
    });
  }

  return i18nFrameworkLocalName;
}

function getRelativePath(from, to) {
  // 计算相对路径
  let relativePath = path.relative(path.dirname(from), to);
  // 确保路径以 ./ 或 ../ 开头
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  // 统一使用 /
  relativePath = relativePath.replace(/\\/g, '/');
  return relativePath;
}

module.exports = {
  replaceTargetStringToTCall
};
