// const compiler = require('vue-template-compiler');
const { transformSync } = require('@babel/core');
const { getVueVersion } = require('../utils/package.cjs');
const vueVersion = getVueVersion();

const vue2Compiler = {
  test(absolutePath) {
    return /\.vue$/.test(absolutePath) && /^2/.test(vueVersion);
  },
  compile(content) {
    const compiler = require('vue-template-compiler');
    const descriptor = compiler.parseComponent(content, {
      // 和vue-loader配置一样
      pad: 'line',
      deindent: false
    });

    const templateRenderCodes = [];
    if (descriptor.template?.content) {
      // todo 考虑先用prettier格式化代码，要考虑在编译阶段时拿到的源码是否已经为格式化后的vue-loader、vite-plugin，再进行编译，减少模板之间的空格？那在插件中也需要先格式化？
      // todo 要校验此处手动编译的结果是否和vue-loader编译的结果一致，否则会影响词条提取
      const result = compiler.compile(descriptor.template.content, {
        // 默认去除多余空白
        preserveWhitespace: false,
        // 不保留template中的注释
        comments: false
      });
      if (result.render) {
        templateRenderCodes.push(result.render);
      }
      // 如果模板中未使用到任何动态参数，则会生成静态渲染函数
      if (result.staticRenderFns?.length) {
        templateRenderCodes.push(...result.staticRenderFns);
      }
    }

    // Babel 转换配置
    const babelOptions = {
      configFile: false,
      // 自动检测模式，当代码中包含 import 或 export 语句时，按 "module" 模式解析，否则按 "script" 模式解析
      sourceType: 'unambiguous',
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
    if (descriptor.script?.content) {
      const scriptCode = descriptor.script.content;
      if (/^(ts|tsx|jsx)$/.test(descriptor.script?.lang)) {
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

module.exports = {
  vue2Compiler
};
