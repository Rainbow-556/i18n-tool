const { parse: parseSFC, compileTemplate, compileScript } = require('@vue/compiler-sfc');
const { transformSync } = require('@babel/core');
const { getVueVersion } = require('../utils/getVueVersion.cjs');
const vueVersion = getVueVersion();

const vue3Compiler = {
  test(absolutePath) {
    return /\.vue$/.test(absolutePath) && /^3/.test(vueVersion);
  },
  compile(content) {
    const { descriptor } = parseSFC(content);
    // console.log('descriptor', descriptor);
    let templateRenderCode;
    if (descriptor.template) {
      const { code } = compileTemplate({
        id: '1',
        filename: '1.vue',
        source: descriptor.template.content,
        compilerOptions: {
          sourceMap: false,
          // 不保留template中的注释
          comments: false
        }
      });
      // console.log('\ntemplateCode\n');
      templateRenderCode = code;
      // console.log(templateRenderCode);
    }

    let finalTemplateRenderCode;
    let finalScriptCode;
    if (descriptor.script || descriptor.scriptSetup) {
      const { content } = compileScript(descriptor, {
        id: '1',
        filename: '1.vue',
        sourceMap: false
        // isProd: true
      });
      const scriptCode = content;
      if (/^(ts|tsx)$/.test(descriptor.scriptSetup?.lang) || /^(ts|tsx)$/.test(descriptor.script?.lang)) {
        // 处理ts和jsx
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
              // Vue 3 插件
              '@vue/babel-plugin-jsx'
            ]
          ]
        };
        if (templateRenderCode) {
          const templateResult = transformSync(templateRenderCode, babelOptions);
          finalTemplateRenderCode = templateResult.code;
        }
        const scriptResult = transformSync(scriptCode, babelOptions);
        finalScriptCode = scriptResult.code;
      } else {
        finalTemplateRenderCode = templateRenderCode;
        finalScriptCode = scriptCode;
      }
    } else {
      finalTemplateRenderCode = templateRenderCode;
      finalScriptCode = '';
    }
    const resultCodes = [];
    if (finalTemplateRenderCode) {
      resultCodes.push(finalTemplateRenderCode);
    }
    if (finalScriptCode) {
      resultCodes.push(finalScriptCode);
    }
    return resultCodes;
  }
};

module.exports = {
  vue3Compiler
};
