const path = require('path');
const i18nToolLoader = require('./loader.cjs');

class I18nToolWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const webpackVersion = compiler.webpack?.version;

    compiler.hooks.afterEnvironment.tap('I18nToolWebpackPlugin', () => {
      const config = compiler.options;
      if (!config.module.rules) {
        config.module.rules = [];
      }
      // 处理json
      const jsonRuleIndex = config.module.rules.findIndex(rule => {
        return rule.test && rule.test.toString().includes('.json$');
      });
      console.log('jsonRuleIndex', jsonRuleIndex);
      if (jsonRuleIndex !== -1) {
        // 检查是否已经有 json-loader
        const hasJsonLoader = config.module.rules[jsonRuleIndex].use.some(loader =>
          typeof loader === 'string'
            ? loader.includes('json-loader')
            : loader.loader && loader.loader.includes('json-loader')
        );
        console.log('hasJsonLoader', hasJsonLoader);
        // 如果没有 json-loader，先添加它
        if (!hasJsonLoader) {
          rule.use.unshift('json-loader');
        }
        config.module.rules[jsonRuleIndex].use.push({
          test: /\.json$/,
          // test: /\.(vue)$/,
          enforce: 'post', // 使用post确保在其他loader之后执行
          loader: path.resolve(__dirname, 'loader.cjs'),
          options: {
            // 自定义loader的选项
          }
        });
      } else {
        // todo webpack v5已测试通过，v4未测试
        compiler.options.module.rules.push({
          test: /\.json$/,
          // todo webpack v4可能是将json直接转换成js，无需使用该属性，v5需要，自动判断webpack版本
          // type: webpackVersion.startsWith('5.') ? 'javascript/auto' : undefined,
          // type: webpackVersion.startsWith('5.') ? 'javascript/auto' : undefined,
          type: 'javascript/auto',
          use: [
            {
              loader: path.resolve(__dirname, 'loader.cjs'),
              options: {}
            }
          ]
        });
      }

      // const vueRuleIndex = config.module.rules.findIndex(rule => {
      //   return rule.test && rule.test.toString().includes('.vue$');
      // });
      // console.log('vueRuleIndex', vueRuleIndex);
      // todo 修改vue-loader的配置comments: false
      // if (vueRuleIndex !== -1) {
      //   config.module.rules[vueRuleIndex].options.compilerOptions.comments = false;
      // }
      const i18nToolLoader = {
        test: /\.(vue|js|cjs|mjs)$/,
        // test: /\.(vue)$/,
        enforce: 'post', // 使用post确保在其他loader之后执行
        loader: path.resolve(__dirname, 'loader.cjs'),
        options: {}
      };

      // if (vueRuleIndex !== -1) {
      //   // 插入到vue-loader规则之后
      //   config.module.rules.splice(vueRuleIndex + 1, 0, customLoaderRule);
      // } else {
      //   config.module.rules.push(customLoaderRule);
      // }

      // 向 module.rules 中添加自定义 Loader
      compiler.options.module.rules.push(i18nToolLoader);
    });

    // emit钩子：资源被写入输出目录前触发
    compiler.hooks.emit.tap('I18nToolWebpackPlugin', () => {
      console.log('Loader 收集的数据:', i18nToolLoader.getData());
    });
  }
}

module.exports = I18nToolWebpackPlugin;
