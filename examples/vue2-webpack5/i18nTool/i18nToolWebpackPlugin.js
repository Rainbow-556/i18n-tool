const path = require('path');

class I18nToolWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEnvironment.tap('I18nToolWebpackPlugin', () => {
      const config = compiler.options;

      if (!config.module.rules) {
        config.module.rules = [];
      }

      const vueRuleIndex = config.module.rules.findIndex(rule => {
        return rule.test && rule.test.toString().includes('.vue$');
      });
      console.log('vueRuleIndex', vueRuleIndex);
      // todo 修改vue-loader的配置comments: false
      // if (vueRuleIndex !== -1) {
      //   config.module.rules[vueRuleIndex].options.compilerOptions.comments = false;
      // }
      const customLoaderRule = {
        test: /\.(vue|js|cjs|mjs|json)$/,
        // test: /\.(vue)$/,
        enforce: 'post', // 使用post确保在vue-loader之后执行
        loader: path.resolve(__dirname, 'i18nToolLoader.js'),
        options: {
          // 自定义loader的选项
        }
      };

      // if (vueRuleIndex !== -1) {
      //   // 插入到vue-loader规则之后
      //   config.module.rules.splice(vueRuleIndex + 1, 0, customLoaderRule);
      // } else {
      //   config.module.rules.push(customLoaderRule);
      // }

      // 向 module.rules 中添加自定义 Loader
      compiler.options.module.rules.push(customLoaderRule);
    });
  }
}

module.exports = I18nToolWebpackPlugin;
