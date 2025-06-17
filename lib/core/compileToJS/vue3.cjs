const { transformSync } = require('@babel/core');
const { getVueVersion } = require('../../utils/package.cjs');

const vueVersion = getVueVersion();

const vue3Compiler = {
  test(absolutePath) {
    return /\.vue$/.test(absolutePath) && /^3/.test(vueVersion);
  },
  compile(content) {
    const { parse: parseSFC, compileTemplate, compileScript } = require('@vue/compiler-sfc');
    const { descriptor } = parseSFC(content);
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
      templateRenderCode = code;
    }

    let finalTemplateRenderCode;
    let finalScriptCode;
    if (descriptor.script || descriptor.scriptSetup) {
      const { content } = compileScript(descriptor, {
        id: '1',
        filename: '1.vue',
        sourceMap: false
      });
      const scriptCode = content;
      if (
        /^(ts|tsx|jsx)$/.test((descriptor.scriptSetup && descriptor.scriptSetup.lang) || '') ||
        /^(ts|tsx|jsx)$/.test((descriptor.script && descriptor.script.lang) || '')
      ) {
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
    // if (content.includes('active')) {
    //   console.log('---- 编译后的vue代码 start ----');
    //   console.log(resultCodes.join('\n\n\n'));
    //   console.log('---- 编译后的vue代码 end ----');
    // }
    return resultCodes;
  }
};

module.exports = { vue3Compiler };
