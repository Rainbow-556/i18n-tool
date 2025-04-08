const compiler = require('vue-template-compiler');
const { transformSync } = require('@babel/core');
const { getVueVersion } = require('../utils/getVueVersion.cjs');
const vueVersion = getVueVersion();

// todo 待实现vue2、json、js、ts
const vue2Compiler = {
  test(absolutePath) {
    return /\.vue$/.test(absolutePath) && /^2/.test(vueVersion);
  },
  compile(content) {
    const descriptor = compiler.parseComponent(content, {
      // 和vue-loader配置一样
      pad: 'line',
      deindent: false
    });
    // console.log('descriptor', descriptor);
    // return;

    const templateRenderCodes = [];
    if (descriptor.template?.content) {
      // todo 考虑先用prettier格式化代码，要考虑在编译阶段时拿到的源码是否已经为格式化后的vue-loader、vite-plugin，再进行编译，减少模板之间的空格？那在插件中也需要先格式化？
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

    let finalScriptCode;
    if (descriptor.script?.content) {
      const scriptCode = descriptor.script.content;
      if (/^(ts|tsx)$/.test(descriptor.script?.lang)) {
        const result = transformSync(scriptCode, babelOptions);
        finalScriptCode = result.code;
      } else {
        finalScriptCode = scriptCode;
      }
    }

    const finalTemplateRenderCodes = [];
    if (templateRenderCodes.length) {
      for (let i = 0; i < templateRenderCodes.length; i++) {
        // todo 处理with语法报错
        const result = transformSync(`function render() {${templateRenderCodes[i]}}`, {
          ...babelOptions,
          // 添加sourceType:'script'来避免严格模式下with语法报错
          sourceType: 'script'
        });
        finalTemplateRenderCodes.push(result.code);
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
