// import { createFilter } from 'vite'; // Vite的模块过滤器
// import { parse as vueParse } from "@vue/compiler-sfc"; // Vue单文件组件解析器
import { parse } from '@babel/parser'; // Babel解析器
import traversePkg from '@babel/traverse'; // AST遍历器
import generatorPkg from '@babel/generator'; // AST生成器
import * as t from '@babel/types'; // Babel类型工具
import { createHash } from 'crypto'; // 加密模块用于生成MD5
import { writeFileSync } from 'fs';
// import { formatAndLint } from './transform3.cjs';
import { formatter } from './transformBiomeJSApi.cjs';

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
      // const files = [
      //   '/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/App.vue',
      //   '/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/test.js',
      //   '/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/components/HelloWorld.vue',
      //   '/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/components/vue2SyntaxView.vue',
      //   ,
      //   '/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/node_modules/@test/lib/vue2SyntaxView.vue'
      // ];
      // if (id.endsWith('.ts') || id.endsWith('.jsx') || id.endsWith('.tsx')) {
      //   console.log(`\n----- 源代码文件-开始: ${id} -----`);
      //   console.log(code);
      // }
      // console.log(`\n----- 源代码文件-开始: ${id} -----`);
      // console.log(code);
      // console.log(`\n----- 源代码文件-结束: ${id} -----`);
      // if (id.includes('node_modules')) {
      //   console.log(`\n----- node_modules源代码文件-开始: ${id} -----`);
      // }
      if (
        !id.endsWith('/App.vue') &&
        !id.endsWith('.ts') &&
        !id.endsWith('.jsx') &&
        !id.endsWith('.tsx') &&
        !id.endsWith('.json')
      ) {
        return { code };
      }

      // if (!id.includes('/src/') || (!id.endsWith('.js') && !id.endsWith('.vue'))) {
      //   return { code };
      // }

      // 转换钩子
      // if (!filter(id)) return; // 过滤非目标文件
      console.log(`\n----- 源代码文件: ${id} -----\n`);

      let processedCode;
      // let formattedCode = await formatAndLint(code);
      await formatter.init();
      let formattedCode = formatter.format(code);
      console.log('\n-- 格式化开始 --\n');
      // formattedCode = formattedCode.replace('import _export_sfc from "�plugin-vue:export-helper";', 'import _export_sfc from "plugin-vue:export-helper";')
      console.log(formattedCode);

      console.log('\n-- 格式化结束 --\n');
      if (id.endsWith('.vue') && 0) {
        // 处理Vue文件
        // const { descriptor } = vueParse(code); // 解析Vue SFC
        // if (!descriptor.script) return; // 没有script标签则跳过
        // const scriptContent = descriptor.script.content;
        // const scriptContent = code;
        const { code: transformed } = transformScript(id, formattedCode, zhMap);
        // processedCode = code.replace(descriptor.script.content, transformed); // 替换原始内容
        // processedCode = transformed.replace(
        //   'import _export_sfc from "�plugin-vue:export-helper";',
        //   'import _export_sfc from "plugin-vue:export-helper";'
        // );
        processedCode = transformed; // 替换原始内容
      } else {
        // 处理JS文件
        const { code: transformed } = transformScript(id, formattedCode, zhMap);
        processedCode = transformed;
      }

      console.log('\n-- 产物开始 --\n');
      console.log(processedCode);
      // console.log(code);
      console.log('\n-- 产物结束 --\n');

      return { code: processedCode, map: null };
    },
    buildEnd() {
      // 构建结束钩子
      console.log('\n----- 构建结束，写json -----\n');
      console.log(zhMap);
      formatter.destroy();
      // writeFileSync('./locales/zh.json', JSON.stringify(zhMap, null, 2));
    }
  };
}

function transformScript(filePath, code, zhMap) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'] // 支持JSX和TS
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
      const { quasis } = path.node; // 静态部分
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
  let pluginImported = false;

  // 遍历检查是否已经导入useI18n
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === '@/i18nPlugin') {
        importFound = true;
        pluginImported = path.node.specifiers.some(specifier => {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: 'i18nPlugin' })) {
            return true;
          }
          return false;
        });
        path.stop();
      }
    }
  });

  if (importFound && !pluginImported) {
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === '@/i18nPlugin') {
          path.node.specifiers.push(t.importSpecifier(t.identifier('i18nPlugin'), t.identifier('i18nPlugin')));
          path.stop();
        }
      }
    });
  } else if (!importFound) {
    // 如果没有从 '@/i18nPlugin' 导入，则添加完整的导入语句
    traverse(ast, {
      Program(path) {
        path.node.body.unshift(
          t.importDeclaration(
            [t.importSpecifier(t.identifier('i18nPlugin'), t.identifier('i18nPlugin'))],
            t.stringLiteral('@/i18nPlugin')
          )
        );
        path.stop();
      }
    });
  }

  // 遍历处理字符串和模板字符串
  traverse(ast, {
    StringLiteral(path) {
      processStringLiteralVue3(path, zhMap); // 处理普通字符串
    },
    TemplateLiteral(path) {
      processTemplateLiteralVue3(filePath, path, zhMap); // 处理模板字符串
    }
  });

  return generate(ast); // 将AST转回代码
}

function processStringLiteralVue3(path, zhMap) {
  const { value } = path.node;
  if (!containsChinese(value)) {
    return;
  }

  console.log('StringLiteral', value);
  // return;

  const md5 = generateMd5(value);
  zhMap[md5] = value;

  // 基于源码生成ast
  // const ast = parse(`i18nPlugin.t('${md5}')`, {
  //   sourceType: "module",
  // });
  // path.replaceWith(ast.program.body.shift());

  // 直接构造ast
  const tCall = t.callExpression(t.memberExpression(t.identifier('i18nPlugin'), t.identifier('t')), [
    t.stringLiteral(md5)
  ]);
  path.replaceWith(tCall);
}

function processTemplateLiteralVue3(filePath, path, zhMap) {
  const quasis = path.node.quasis; // 静态部分
  const expressions = path.node.expressions; // 动态表达式
  // 拼接原始模板字符串（用{index}占位动态部分）
  let staticStrArr = quasis.map(q => q.value.cooked);
  let templateStr = staticStrArr[0];
  for (let i = 1; i < staticStrArr.length; i++) {
    // templateStr = templateStr + `{param${i - 1}}` + staticStrArr[i];
    templateStr = templateStr + `{${i - 1}}` + staticStrArr[i];
  }

  if (!containsChinese(templateStr)) {
    return;
  }

  console.log('TemplateLiteral', templateStr);
  // return;

  const md5 = generateMd5(templateStr);
  zhMap[md5] = templateStr;

  // 创建参数对象：{ 0: a, 1: b } 形式
  const params = expressions.map((exp, i) => t.objectProperty(t.numericLiteral(i), exp));
  // const params = expressions.map((exp, i) => t.objectProperty(t.stringLiteral(`param${i}`), exp));

  const tCall = t.callExpression(t.memberExpression(t.identifier('i18nPlugin'), t.identifier('t')), [
    t.stringLiteral(md5),
    t.objectExpression(params)
  ]);
  path.replaceWith(tCall);
}

function containsChinese(str) {
  // 使用Unicode范围检测中文
  return /[\u4e00-\u9fa5]/.test(str);
}

function generateMd5(key) {
  return createHash('md5').update(key).digest('hex');
}
