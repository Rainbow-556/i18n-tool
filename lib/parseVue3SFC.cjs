// 从vue 3.2.13+开始，vue/compiler-sfc 已经内置了对.vue文件的编译，不需要额外安装
const { parse: parseSFC, compileTemplate, compileScript } = require('@vue/compiler-sfc');
const { transformSync } = require('@babel/core');
// import { parse } from '@babel/parser';
// import traversePkg from '@babel/traverse';
// import generatorPkg from '@babel/generator';
const fs = require('fs');
const path = require('path');

// const traverse = traversePkg.default;
// const generate = generatorPkg.default;

// const fileContent = fs.readFileSync(path.resolve("./src/App.vue"), "utf-8");
// const fileContent = fs.readFileSync(path.resolve(__dirname, './vue2SyntaxView.vue'), 'utf-8');
const fileContent = fs.readFileSync(path.resolve(__dirname, 'vue3TSXSyntaxView.vue'), 'utf-8');
const { descriptor } = parseSFC(fileContent);
// console.log('descriptor', descriptor);
let templateCode = '';
if (descriptor.template) {
  const { code } = compileTemplate({
    id: '1',
    filename: '1.vue',
    source: descriptor.template.content,
    compilerOptions: {
      // 不保留template中的注释
      comments: false
    }
  });
  console.log('\ntemplateCode\n');
  templateCode = code;
  console.log(templateCode);
}

let scriptCode = '';
if (descriptor.script || descriptor.scriptSetup) {
  const { content } = compileScript(descriptor, {
    id: '1',
    filename: '1.vue',
    sourceMap: false
  });
  scriptCode = content;
  console.log('\nscriptCode\n');
  console.log(scriptCode);

  let newScriptCode;
  let newTemplateCode;
  if (/^(ts|tsx)$/.test(descriptor.scriptSetup?.lang) || /^(ts|tsx)$/.test(descriptor.script?.lang)) {
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
        ['@vue/babel-plugin-jsx'] // Vue 3 插件
      ]
    };
    if (templateCode) {
      const result = transformSync(templateCode, babelOptions);
      newTemplateCode = result.code;
      console.log('\nnewTemplateCode\n');
      console.log(newTemplateCode);
    }
    const result = transformSync(scriptCode, babelOptions);
    newScriptCode = result.code;
    console.log('\nnewScriptCode\n');
    console.log(newScriptCode);
  }
}
