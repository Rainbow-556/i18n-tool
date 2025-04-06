const compiler = require('vue-template-compiler');
const { transformSync } = require('@babel/core');
const fs = require('fs');
const path = require('path');

// const fileContent = fs.readFileSync(path.resolve("./src/App.vue"), "utf-8");
// const fileContent = fs.readFileSync(path.resolve(__dirname, './vue2SyntaxView.vue'), 'utf-8');
const fileContent = fs.readFileSync(path.resolve(__dirname, 'vue2SyntaxView.vue'), 'utf-8');
const descriptor = compiler.parseComponent(fileContent, {
  // 和vue-loader配置一样
  pad: 'line',
  deindent: false
});
// console.log('descriptor', descriptor);
// return;

const templateCodes = [];
if (descriptor.template?.content) {
  const result = compiler.compile(descriptor.template.content, {
    // 默认去除多余空白
    preserveWhitespace: false,
    // 不保留template中的注释
    comments: false
  });
  if (result.render) {
    templateCodes.push(result.render);
  }
  // 如果模板中未使用到任何动态参数，则会生成静态渲染函数
  if (result.staticRenderFns?.length) {
    templateCodes.push(...result.staticRenderFns);
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
    ['@vue/babel-plugin-transform-vue-jsx'] // Vue 2 插件
  ]
};

let scriptCode = '';
if (descriptor.script?.content) {
  scriptCode = descriptor.script.content;
  console.log('\nscriptCode\n');
  console.log(scriptCode);

  let newScriptCode;
  if (/^(ts|tsx)$/.test(descriptor.script?.lang)) {
    const result = transformSync(scriptCode, babelOptions);
    newScriptCode = result.code;
    console.log('\nnewScriptCode\n');
    console.log(newScriptCode);
  }
}

console.log('\ntemplateCodes\n');
console.log(templateCodes);
if (templateCodes.length) {
  const newTemplateCodes = [];
  for (const templateCode of templateCodes) {
    const result = transformSync(`function render() {${templateCode}}`, {
      ...babelOptions,
      // 添加sourceType:'script'来避免严格模式下with语法报错
      sourceType: 'script'
    });
    newTemplateCodes.push(result.code);
  }
  console.log('\nnewTemplateCodes\n');
  console.log(newTemplateCodes);
}
