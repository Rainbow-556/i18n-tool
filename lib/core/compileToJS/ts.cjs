const { transformSync } = require('@babel/core');

const tsCompiler = {
  test(absolutePath) {
    return /\.ts$/.test(absolutePath);
  },
  compile(content) {
    const babelOptions = {
      configFile: false,
      presets: [
        // ESNext特性支持
        // '@babel/preset-env',
        // [
        //   '@babel/preset-env',
        //   {
        //     // 指定目标环境为支持ES模块的现代浏览器
        //     targets: {
        //       esmodules: true
        //       // 可选：指定具体浏览器版本
        //       // chrome: '80',
        //       // firefox: '75'
        //     },
        //     // 仅转换语法，不引入polyfill
        //     useBuiltIns: false
        //   }
        // ],
        [
          // 负责语法转换
          '@babel/preset-typescript',
          {
            allExtensions: true
          }
        ]
      ]
    };
    const scriptResult = transformSync(content, babelOptions);
    // console.log('---- 编译后的ts代码 start2 ----');
    // console.log(scriptResult.code);
    // console.log('---- 编译后的ts代码 end ----');
    return [scriptResult.code];
  }
};

module.exports = { tsCompiler };
