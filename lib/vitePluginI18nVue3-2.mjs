import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import generatorPkg from '@babel/generator';
import * as t from '@babel/types';
import { codeFormatter } from '../lib/utils/codeFormatter.cjs';
import { containsChinese } from '../lib/utils/containsChinese.cjs';
import { generateKey } from '../lib/utils/generateKey.cjs';
import { shouldProcessFile } from '../lib/utils/shouldProcessFile.cjs';
import { i18nToolConfig } from '../lib/utils/i18nToolConfig.cjs';
import path from 'path';
import fs from 'fs';

const traverse = traversePkg.default;
const generate = generatorPkg.default;

// 主插件入口
export default function i18nPlugin() {
  const zhMap = {};
  // const filter = createFilter(['**/*.js', '**/*.vue']); // 创建文件过滤器
  return {
    name: 'vite-plugin-i18n-vue3',
    // 设置插件只在构建时应用，serve时不应用
    // apply: "build",
    async transform(code, id) {
      // 过滤不需要处理的文件
      if (!shouldProcessFile(id)) {
        return { code };
      }

      // 在transform钩子中的入参code都已经是js代码
      // console.log(`\n----- 源代码文件-开始: ${id} -----\n`);
      // console.log(code);
      // console.log(`\n----- 源代码文件-结束: ${id} -----\n`);
      // return { code };
      console.log(`\n----- 源代码文件: ${id} -----\n`);

      // let formattedCode = await formatAndLint(code);
      await codeFormatter.init();
      const formattedCode = codeFormatter.format(code);
      // console.log('\n-- 格式化开始 --\n');
      // console.log(formattedCode);
      // console.log('\n-- 格式化结束 --\n');

      const { code: transformedCode } = transformCode(id, formattedCode, zhMap);

      console.log('\n-- 产物开始 --\n');
      console.log(transformedCode);
      console.log('\n-- 产物结束 --\n');

      return { code: transformedCode };
    },
    buildEnd() {
      // 构建结束钩子
      console.log('\n----- 构建结束 zhMap -----\n');
      console.log('count:', Object.keys(zhMap).length);
      console.log(zhMap);
      // todo 测试
      fs.writeFileSync(path.resolve('entryFromBuild.json'), JSON.stringify(zhMap, null, 2));
    }
  };
}

function transformCode(filePath, code, zhMap) {
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
        return;
      }
    },
    TemplateLiteral(path) {
      // 静态部分
      const { quasis } = path.node;
      if (quasis.some(q => containsChinese(q.value.cooked))) {
        hasChinese = true;
        path.stop();
        return;
      }
    }
  });

  if (!hasChinese) {
    console.log('\n没有中文，忽略', filePath);
    return { code };
  }

  let importFound = false;
  let i18nFrameworkImported = false;
  let i18nFrameworkLocalName;

  // 判断是否已经导入i18nToolConfig.i18nAlias
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === i18nToolConfig.i18nAlias) {
        importFound = true;
        i18nFrameworkImported = path.node.specifiers.some(specifier => {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: 'i18nFramework' })) {
            i18nFrameworkLocalName = specifier.local.name;
            return true;
          }
          return false;
        });
        path.stop();
      }
    }
  });

  i18nFrameworkLocalName = i18nFrameworkLocalName || 'i18nFramework';

  if (importFound && !i18nFrameworkImported) {
    // i18nToolConfig.i18nAlias 已经导入，但没有导入 i18nFramework
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === i18nToolConfig.i18nAlias) {
          path.node.specifiers.push(
            t.importSpecifier(t.identifier(i18nFrameworkLocalName), t.identifier(i18nFrameworkLocalName))
          );
          path.stop();
        }
      }
    });
  } else if (!importFound) {
    // i18nToolConfig.i18nAlias 没有导入，需要在顶部插入 import
    traverse(ast, {
      Program(path) {
        path.node.body.unshift(
          t.importDeclaration(
            [t.importSpecifier(t.identifier(i18nFrameworkLocalName), t.identifier(i18nFrameworkLocalName))],
            t.stringLiteral(i18nToolConfig.i18nAlias)
          )
        );
        path.stop();
      }
    });
  }

  // 把字符串字面量和模板字符串替换为i18nFramework.t()
  traverse(ast, {
    // 处理字符串字面量
    StringLiteral(path) {
      // todo 待处理字符串中含有html标签的情况、字符串中url中文编码的情况
      processStringLiteralVue3(path, i18nFrameworkLocalName, zhMap);
    },
    // 处理模板字符串
    TemplateLiteral(path) {
      processTemplateLiteralVue3(path, i18nFrameworkLocalName, zhMap);
    }
  });

  // 将AST转回代码
  return generate(ast);
}

function processStringLiteralVue3(path, i18nFrameworkLocalName, zhMap) {
  const { value } = path.node;
  if (!containsChinese(value)) {
    return;
  }

  // console.log('StringLiteral', value);

  const md5 = generateKey(value);
  zhMap[md5] = value;

  // 基于源码生成ast
  // const ast = parse(`i18nPlugin.t('${md5}')`, {
  //   sourceType: "module",
  // });
  // path.replaceWith(ast.program.body.shift());

  // 直接构造ast
  const tCall = t.callExpression(t.memberExpression(t.identifier(i18nFrameworkLocalName), t.identifier('t')), [
    t.stringLiteral(md5)
  ]);
  path.replaceWith(tCall);
}

function processTemplateLiteralVue3(path, i18nFrameworkLocalName, zhMap) {
  // 静态部分
  const {
    // 静态部分
    quasis,
    // 动态表达式
    expressions
  } = path.node;
  // 拼接原始模板字符串（用{p + index}占位动态部分）
  let staticStrArr = quasis.map(q => q.value.cooked);
  let templateStr = staticStrArr[0];
  for (let i = 1; i < staticStrArr.length; i++) {
    templateStr = templateStr + `{p${i - 1}}` + staticStrArr[i];
  }

  if (!containsChinese(templateStr)) {
    return;
  }

  // console.log('TemplateLiteral', templateStr);

  const md5 = generateKey(templateStr);
  zhMap[md5] = templateStr;

  // 创建参数对象：{ p0: a, p1: b } 形式
  const params = expressions.map((exp, i) => t.objectProperty(t.stringLiteral(`p${i}`), exp));

  const tCall = t.callExpression(t.memberExpression(t.identifier(i18nFrameworkLocalName), t.identifier('t')), [
    t.stringLiteral(md5),
    t.objectExpression(params)
  ]);
  path.replaceWith(tCall);
}
