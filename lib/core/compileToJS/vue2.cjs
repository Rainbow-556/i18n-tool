const { transformSync } = require('@babel/core');
const { getVueVersion } = require('../../utils/package.cjs');
const path = require('path');
const fs = require('fs');

const vueVersion = getVueVersion();

const vue2Compiler = {
  absolutePath: '',
  test(absolutePath) {
    this.absolutePath = absolutePath;
    return /\.vue$/.test(absolutePath) && /^2/.test(vueVersion);
  },
  compile(content) {
    content = handleHtmlTemplate(content, this.absolutePath);

    // 导入 vue-template-compiler 模块时，它内部就会检测vue和vue-template-compiler的版本是否一致，不一致就会报错，所以不在顶层导入
    const compiler = require('vue-template-compiler');
    const descriptor = compiler.parseComponent(content, {
      // 和vue-loader配置一样
      pad: 'line',
      deindent: false
    });

    const templateRenderCodes = [];
    if (descriptor.template && descriptor.template.content) {
      const result = compiler.compile(descriptor.template.content, {
        // 文档：https://github.com/vuejs/vue-docs-zh-cn/blob/master/vue-template-compiler/README.md
        // 默认值为true
        // preserveWhitespace: true,
        // 不保留template中的注释，webpack v4/5 + vue2的template转成js后，会自动去除注释
        comments: false
      });
      if (result.render) {
        templateRenderCodes.push(result.render);
      }
      // 如果模板中未使用到任何动态参数，则会生成静态渲染函数
      if (result.staticRenderFns && result.staticRenderFns.length) {
        templateRenderCodes.push(...result.staticRenderFns);
      }
    }

    // Babel 转换配置
    const babelOptions = {
      configFile: false,
      // 自动检测模式，当代码中包含 import 或 export 语句时，按 "module" 模式解析，否则按 "script" 模式解析
      sourceType: 'unambiguous',
      // 保留注释
      comments: true,
      presets: [
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true
          }
        ]
      ],
      plugins: [
        [
          // Vue 2 插件
          '@vue/babel-plugin-transform-vue-jsx'
        ]
      ]
    };

    const finalTemplateRenderCodes = [];
    if (templateRenderCodes.length) {
      for (let i = 0; i < templateRenderCodes.length; i++) {
        // vue2的template转成js后，仅仅是 with(this) {}，需要手动加上完整函数的声明，否则babel解析会报错
        const result = transformSync(`function render() {${templateRenderCodes[i]}}`, babelOptions);
        finalTemplateRenderCodes.push(result.code);
      }
    }

    let finalScriptCode;
    if (descriptor.script && descriptor.script.content) {
      const scriptCode = descriptor.script.content;
      if (/^(ts|tsx|jsx)$/.test((descriptor.script && descriptor.script.lang) || '')) {
        const result = transformSync(scriptCode, babelOptions);
        finalScriptCode = result.code;
      } else {
        finalScriptCode = scriptCode;
      }
    }

    const resultCodes = [];
    if (finalTemplateRenderCodes.length) {
      resultCodes.push(...finalTemplateRenderCodes);
    }
    if (finalScriptCode) {
      resultCodes.push(finalScriptCode);
    }
    return resultCodes;
  }
};

/** 兼容vue2的template中使用src引入html文件 */
function handleHtmlTemplate(content, absolutePath) {
  const regex = /<template\s+src="([^"]+)"[^>]*>\s*<\/template>/;
  const match = content.match(regex);
  if (match && match[1]) {
    const srcPath = match[1];
    const absoluteHtmlPath = path.resolve(path.dirname(absolutePath), srcPath);
    // console.log('提取成功:', absoluteHtmlPath);
    const htmlContent = fs.readFileSync(absoluteHtmlPath, 'utf-8');
    // console.log('htmlContent', htmlContent);
    // 将htmlContent替换到content中
    content = content.replace(match[0], `<template>${htmlContent}</template>`);
    // console.log('content\n', content);
  }
  return content;
}

module.exports = { vue2Compiler };
