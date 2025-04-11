import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import generatorPkg from '@babel/generator';
import * as t from '@babel/types';
import { codeFormatter } from '../lib/utils/codeFormatter.cjs';
import { containsChinese } from '../lib/utils/containsChinese.cjs';
import { generateKey } from '../lib/utils/generateKey.cjs';
import { shouldProcessFile } from '../lib/utils/shouldProcessFile.cjs';
import { i18nToolConfig } from '../lib/utils/i18nToolConfig.cjs';
import { langPack } from '../lib/utils/langPack.cjs';
import { chalkLog } from '../lib/utils/chalkLog.cjs';
import path from 'path';
import fs from 'fs';

const traverse = traversePkg.default;
const generate = generatorPkg.default;

export default function i18nPlugin() {
  const zhMap = {};
  /** serve | build */
  let compileMode;
  const missingEntries = {};
  return {
    name: 'vite-plugin-i18n-vue3',
    // 设置插件只在构建时应用，serve时不应用
    // apply: "build",
    configResolved(config) {
      compileMode = config.command;
      langPack.init();
    },
    async transform(code, id) {
      // 过滤不需要处理的文件
      if (!shouldProcessFile(id)) {
        return { code };
      }

      // 在transform钩子中的入参code都已经是js代码
      // console.log(`\n----- 源代码文件-开始: ${id} -----\n`);
      // console.log(code);
      // console.log(`\n----- 源代码文件-结束: ${id} -----\n`);

      await codeFormatter.init();
      const formattedCode = codeFormatter.format(code);
      // console.log('\n-- 格式化开始 --\n');
      // console.log(formattedCode);
      // console.log('\n-- 格式化结束 --\n');

      const { code: transformedCode } = transformCode(id, formattedCode, zhMap, langPack, missingEntries);
      // console.log(`\n-- 产物开始 ${id} --\n`);
      // console.log(transformedCode);
      // console.log(`\n-- 产物结束 ${id} --\n`);
      return { code: transformedCode };
    },
    buildEnd() {
      // 构建结束钩子
      console.log('\n----- 构建结束 zhMap -----\n');
      console.log('count:', Object.keys(zhMap).length);
      console.log(zhMap);
      // todo 测试
      fs.writeFileSync(path.resolve('entryFromBuild.json'), JSON.stringify(zhMap, null, 2));

      if (Object.keys(missingEntries).length > 0) {
        if (compileMode === 'serve') {
          // todo 需要找到本次构建结束的钩子中打印以下信息，否则无法打印，serve时一直未构建结束
          chalkLog('gray', `以下词条未提取，将会在 git pre-commit 中自动提取`);
          chalkLog('gray', JSON.stringify(missingEntries, null, 2));
        } else if (compileMode === 'build') {
          chalkLog('red', `构建失败，以下词条未提取，请执行 npx i18n-tool extract 命令`);
          chalkLog('red', JSON.stringify(missingEntries, null, 2));
          process.exit(1);
        }
      }
    }
  };
}

function transformCode(filePath, code, zhMap, langPack, missingEntries) {
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
      Program(astPath) {
        // vite插件在json转换成js的产物代码中，导入语句只能是使用相对路径，否则会报错。json的js产物中必然是没有import语句，所以在此处插入即可
        const importPath = filePath.endsWith('.json')
          ? getRelativePath(filePath, path.resolve(i18nToolConfig.i18nDir, 'index'))
          : i18nToolConfig.i18nAlias;
        astPath.node.body.unshift(
          t.importDeclaration(
            [t.importSpecifier(t.identifier(i18nFrameworkLocalName), t.identifier(i18nFrameworkLocalName))],
            t.stringLiteral(importPath)
          )
        );
        astPath.stop();
      }
    });
  }

  // 把字符串字面量和模板字符串替换为i18nFramework.t()
  traverse(ast, {
    // 处理字符串字面量
    StringLiteral(path) {
      // todo 待处理字符串中含有html标签的情况、字符串中url中文编码的情况
      processStringLiteralVue3(path, i18nFrameworkLocalName, zhMap, langPack, missingEntries);
    },
    // 处理模板字符串
    TemplateLiteral(path) {
      processTemplateLiteralVue3(path, i18nFrameworkLocalName, zhMap, langPack, missingEntries);
    }
  });

  // 将AST转回代码
  return generate(ast);
}

function processStringLiteralVue3(path, i18nFrameworkLocalName, zhMap, langPack, missingEntries) {
  const { value } = path.node;
  if (!containsChinese(value)) {
    return;
  }

  // console.log('StringLiteral', value);

  const md5 = generateKey(value);
  zhMap[md5] = value;

  if (collectMissingEntry(md5, value, langPack, missingEntries)) {
    return;
  }

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

function processTemplateLiteralVue3(path, i18nFrameworkLocalName, zhMap, langPack, missingEntries) {
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

  if (collectMissingEntry(md5, templateStr, langPack, missingEntries)) {
    return;
  }

  // 创建参数对象：{ p0: a, p1: b } 形式
  const params = expressions.map((exp, i) => t.objectProperty(t.stringLiteral(`p${i}`), exp));
  const tCall = t.callExpression(t.memberExpression(t.identifier(i18nFrameworkLocalName), t.identifier('t')), [
    t.stringLiteral(md5),
    t.objectExpression(params)
  ]);
  path.replaceWith(tCall);
}

function collectMissingEntry(key, content, langPack, missingEntries) {
  // 找出src/i18n/(uncalibrated|calibrated)/(zh-CN|en-US).json中不存在的词条
  const missingLangs = langPack.checkMissingLangs(key);
  if (missingLangs.length > 0) {
    missingEntries[key] = {
      content,
      missingLangs
    };
    return true;
  }
  return false;
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
