// 导入必要模块
import { createFilter } from "vite"; // Vite的模块过滤器
// import { parse as vueParse } from "@vue/compiler-sfc"; // Vue单文件组件解析器
import { parse } from "@babel/parser"; // Babel解析器
import traverse from "@babel/traverse"; // AST遍历器
import generate from "@babel/generator"; // AST生成器
import * as t from "@babel/types"; // Babel类型工具
import { createHash } from "crypto"; // 加密模块用于生成MD5
import { readFileSync, writeFileSync } from "fs"; // 文件系统操作

// 主插件入口
export default function i18nPlugin() {
  const zhMap = {}; // 存储中文映射关系的字典
  const filter = createFilter(["**/*.js", "**/*.vue"]); // 创建文件过滤器

  return {
    name: "vite-plugin-i18n",
    // 设置插件只在构建时应用，serve时不应用
    apply: "build",
    transform(code, id) {
      if (
        id !==
          "/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/App.vue" &&
        id !==
          "/Users/lexin/Desktop/my/work/projects/abroad-middle/vite-project/src/test.js"
        // !id.endsWith(".vue")
      ) {
        return {
          code,
        };
      }
      // 转换钩子
      // if (!filter(id)) return; // 过滤非目标文件

      let processedCode = code;
      if (id.endsWith(".vue")) {
        // 处理Vue文件
        // const { descriptor } = vueParse(code); // 解析Vue SFC
        // if (!descriptor.script) return; // 没有script标签则跳过
        // const scriptContent = descriptor.script.content;
        const scriptContent = code;
        const { code: transformed } = transformScriptVue3(
          id,
          scriptContent,
          zhMap
        ); // 转换script内容
        // processedCode = code.replace(descriptor.script.content, transformed); // 替换原始内容
        processedCode = transformed; // 替换原始内容
      } else {
        // 处理JS文件
        const { code: transformed } = transformScriptVue3(id, code, zhMap);
        processedCode = transformed;
      }

      console.log(`\n----- 源代码文件: ${id} -----\n`);
      console.log(processedCode);
      console.log("\n----- 源代码文件结束 -----\n");

      return { code: processedCode, map: null }; // 返回处理后的代码
    },
    buildEnd() {
      // 构建结束钩子
      writeFileSync("zh.json", JSON.stringify(zhMap, null, 2)); // 写入语言文件
    },
  };
}

function transformScriptVue3(filePath, code, zhMap) {
  const ast = parse(code, {
    // 将代码解析为AST
    sourceType: "module",
    // plugins: ["jsx", "typescript"], // 支持JSX和TS
  });

  // 遍历是否有中文
  let hasChinese = false;
  traverse.default(ast, {
    StringLiteral(path) {
      const { value } = path.node;
      if (isChinese(value)) {
        hasChinese = true;
        path.stop();
        return;
      }
    },
    TemplateLiteral(path) {
      const quasis = path.node.quasis; // 静态部分
      if (quasis.some((q) => isChinese(q.value.cooked))) {
        hasChinese = true;
        path.stop();
        return;
      }
    },
  });

  if (!hasChinese) {
    console.log("\n没有中文，忽略", filePath);
    return { code };
  }
  // return { code };

  let importFound = false;
  let pluginImported = false;

  // 遍历检查是否已经导入useI18n
  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "@/i18nPlugin") {
        importFound = true;
        pluginImported = path.node.specifiers.some((specifier) => {
          if (
            t.isImportSpecifier(specifier) &&
            t.isIdentifier(specifier.imported, { name: "i18nPlugin" })
          ) {
            return true;
          }
          return false;
        });
        path.stop();
      }
    },
  });

  if (importFound && !pluginImported) {
    traverse.default(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === "@/i18nPlugin") {
          path.node.specifiers.push(
            t.importSpecifier(
              t.identifier("i18nPlugin"),
              t.identifier("i18nPlugin")
            )
          );
          path.stop();
        }
      },
    });
  } else if (!importFound) {
    // 如果没有从 '@/a' 导入，则添加完整的导入语句
    traverse.default(ast, {
      Program(path) {
        path.node.body.unshift(
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("i18nPlugin"),
                t.identifier("i18nPlugin")
              ),
            ],
            t.stringLiteral("@/i18nPlugin")
          )
        );
        path.stop();
      },
    });
  }

  // 遍历处理字符串和模板字符串
  traverse.default(ast, {
    StringLiteral(path) {
      processStringLiteralVue3(path, zhMap); // 处理普通字符串
    },
    TemplateLiteral(path) {
      processTemplateLiteralVue3(filePath, path, zhMap); // 处理模板字符串
    },
  });

  return generate.default(ast); // 将AST转回代码
}

function processStringLiteralVue3(path, zhMap) {
  const { value } = path.node;
  if (!isChinese(value)) {
    return;
  }
  const md5 = generateMd5(value);
  zhMap[md5] = value;

  // 基于源码生成ast
  // const ast = parse(`i18nPlugin.t('${md5}')`, {
  //   sourceType: "module",
  // });
  // path.replaceWith(ast.program.body.shift());

  // 直接构造ast
  const tCall = t.callExpression(
    t.memberExpression(t.identifier("i18nPlugin"), t.identifier("t")),
    [t.stringLiteral(md5)]
  );
  path.replaceWith(tCall);
}

function processTemplateLiteralVue3(filePath, path, zhMap) {
  const quasis = path.node.quasis; // 静态部分
  const expressions = path.node.expressions; // 动态表达式
  // 拼接原始模板字符串（用{index}占位动态部分）
  let staticStrArr = quasis.map((q) => q.value.cooked);
  let templateStr = staticStrArr[0];
  for (let i = 1; i < staticStrArr.length; i++) {
    templateStr = templateStr + `{${i - 1}}` + staticStrArr[i];
  }

  if (!isChinese(templateStr)) {
    return;
  }

  const md5 = generateMd5(templateStr);
  zhMap[md5] = templateStr;

  // 创建参数对象：{ 0: a, 1: b } 形式
  const params = expressions.map((exp, i) =>
    t.objectProperty(t.numericLiteral(i), exp)
  );

  const tCall = t.callExpression(
    t.memberExpression(t.identifier("i18nPlugin"), t.identifier("t")),
    [t.stringLiteral(md5), t.objectExpression(params)]
  );
  path.replaceWith(tCall);
}

// AST转换主函数
function transformScript(filePath, code, zhMap) {
  const ast = parse(code, {
    // 将代码解析为AST
    sourceType: "module",
    // plugins: ["jsx", "typescript"], // 支持JSX和TS
  });

  let shouldInjectI18n = true; // 是否需要注入i18n的标志

  // 第一次遍历：检查是否已经导入useI18n
  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "vue-i18n") {
        // 如果发现已有导入，设置不需要注入
        shouldInjectI18n = !path.node.specifiers.some(
          (spec) =>
            t.isImportSpecifier(spec) && spec.imported.name === "useI18n"
        );
        path.stop(); // 找到后停止遍历
      }
    },
  });

  // 第二次遍历：处理字符串和模板字符串
  traverse.default(ast, {
    StringLiteral(path) {
      processStringLiteral(path, zhMap); // 处理普通字符串
    },
    TemplateLiteral(path) {
      processTemplateLiteral(filePath, path, zhMap); // 处理模板字符串
    },
  });

  if (shouldInjectI18n) {
    injectI18n(ast); // 注入i18n相关代码
  }

  return generate.default(ast); // 将AST转回代码
}

// 处理普通字符串
function processStringLiteral(path, zhMap) {
  const { value } = path.node;
  if (!isChinese(value)) return; // 非中文字符串跳过

  const md5 = generateMd5(value); // 生成MD5
  zhMap[md5] = value; // 存储到字典

  // 生成 t('md5') 调用表达式
  const tCall = t.callExpression(t.identifier("t"), [t.stringLiteral(md5)]);
  path.replaceWith(tCall); // 替换原始节点
}

// 处理模板字符串
function processTemplateLiteral(filePath, path, zhMap) {
  const quasis = path.node.quasis; // 静态部分
  const expressions = path.node.expressions; // 动态表达式

  if (expressions.some((exp) => exp.type !== "Identifier")) {
    // 包含非标识符的表达式，不处理，目前只支持处理简单的${变量}形式
    console.log("\n暂不支持复杂的模板字符串", filePath);
    return;
  }

  // 拼接原始模板字符串（用${}占位动态部分）
  let templateStr = ""; //quasis.map((q) => q.value.cooked).join("{}");
  //
  quasis.forEach((q, index) => {
    templateStr += q.value.cooked;
    if (index < expressions.length) {
      templateStr += `{${expressions[index].name}}`;
    }
  });
  //
  if (!isChinese(templateStr)) return;

  const md5 = generateMd5(templateStr);
  zhMap[md5] = templateStr;

  // 创建参数对象：{ 0: a, 1: b } 形式
  const params = expressions.map((exp, i) =>
    // t.objectProperty(t.numericLiteral(i), exp)
    t.objectProperty(t.identifier(exp.name), exp)
  );

  // 生成 t('md5', { 0: a, 1: b }) 调用表达式
  const tCall = t.callExpression(t.identifier("t"), [
    t.stringLiteral(md5),
    t.objectExpression(params), // 参数对象
  ]);

  path.replaceWith(tCall); // 替换原始节点
}

// 注入i18n相关代码
function injectI18n(ast) {
  // 创建导入语句：import { useI18n } from 'vue-i18n';
  const importNode = t.importDeclaration(
    [t.importSpecifier(t.identifier("useI18n"), t.identifier("useI18n"))],
    t.stringLiteral("vue-i18n")
  );

  // 创建变量声明：const { t } = useI18n();
  const variableDeclarator = t.variableDeclarator(
    t.objectPattern([t.objectProperty(t.identifier("t"), t.identifier("t"))]),
    t.callExpression(t.identifier("useI18n"), [])
  );
  const useI18nNode = t.variableDeclaration("const", [variableDeclarator]);

  // 将新节点插入AST
  ast.program.body.unshift(importNode); // 插入到最前面
  ast.program.body.splice(1, 0, useI18nNode); // 在导入语句后插入
}

// 中文字符检测
function isChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str); // 使用Unicode范围检测中文
}

// MD5生成函数
function generateMd5(str) {
  return createHash("md5").update(str).digest("hex"); // 生成32位hex
}
