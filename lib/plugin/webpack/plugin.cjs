const path = require('path');
const { entryChecker } = require('../../core/entryChecker.cjs');

class I18nToolWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const webpackVersion = compiler.webpack?.version || compiler.constructor?.version;
    /** 构建模式，'development' | 'production' */
    const { mode } = compiler.options;

    compiler.hooks.afterEnvironment.tap('I18nToolWebpackPlugin', () => {
      this.modifyVueLoaderOptions(compiler);

      // 处理json
      const jsonRuleIndex = compiler.options.module.rules.findIndex(rule => {
        return rule.test && rule.test.toString().includes('.json$');
      });
      console.log('jsonRuleIndex', jsonRuleIndex);
      if (jsonRuleIndex !== -1) {
        // 检查是否已经有 json-loader
        const hasJsonLoader = compiler.options.module.rules[jsonRuleIndex].use.some(loader =>
          typeof loader === 'string'
            ? loader.includes('json-loader')
            : loader.loader && loader.loader.includes('json-loader')
        );
        console.log('hasJsonLoader', hasJsonLoader);
        // 如果没有 json-loader，先添加它
        if (!hasJsonLoader) {
          rule.use.unshift('json-loader');
        }
        compiler.options.module.rules[jsonRuleIndex].use.push({
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
          type: 'javascript/auto',
          use: [
            {
              loader: path.resolve(__dirname, 'loader.cjs'),
              options: {}
            }
          ]
        });
      }

      const i18nToolLoader = {
        test: /\.(vue|js|cjs|mjs)$/,
        // test: /\.(vue)$/,
        enforce: 'post', // 使用post确保在其他loader之后执行
        loader: path.resolve(__dirname, 'loader.cjs'),
        options: {}
      };

      // if (vueRuleIndex !== -1) {
      //   // 插入到vue-loader规则之后
      //   compiler.options.module.rules.splice(vueRuleIndex + 1, 0, customLoaderRule);
      // } else {
      //   compiler.options.module.rules.push(customLoaderRule);
      // }

      // 向 module.rules 中添加自定义 Loader
      compiler.options.module.rules.push(i18nToolLoader);
    });

    this.checkEntriesOnBuildDone(compiler);
  }

  modifyVueLoaderOptions(compiler) {
    // VueLoaderPlugin也许会修改到
    // vue-template-compiler v2.6.14，模板中有注释的节点，默认会移除，无需手动修改
    // 文档：https://github.com/vuejs/vue/blob/dev/packages/vue-template-compiler/README.md
    const vueRuleIndex = compiler.options.module.rules.findIndex(rule => {
      return rule.test && rule.test.toString().includes('.vue$');
    });
    if (vueRuleIndex !== -1) {
      const vueLoader = compiler.options.module.rules[vueRuleIndex].use.find(loader =>
        loader.loader?.includes('vue-loader')
      );
      if (vueLoader) {
        vueLoader.options = vueLoader.options || {};
        vueLoader.options.compilerOptions = vueLoader.options.compilerOptions || {};
        vueLoader.options.compilerOptions.comments = false;
      }
    }
  }

  checkEntriesOnBuildDone(compiler) {
    const { mode } = compiler.options;
    if (mode === 'development') {
      // done钩子：serve模式每次编译完成后触发
      compiler.hooks.done.tap('I18nToolWebpackPlugin', () => {
        entryChecker.check('serve');
      });
    } else if (mode === 'production') {
      // emit钩子：资源被写入输出目录前触发
      compiler.hooks.emit.tap('I18nToolWebpackPlugin', () => {
        entryChecker.check('build');
      });
    }
  }
}

module.exports = I18nToolWebpackPlugin;
