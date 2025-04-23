const path = require('path');
const { entryChecker } = require('../../core/entryChecker.cjs');

class I18nToolWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    // 只兼容了webpack v4和v5
    // const webpackVersion = compiler.webpack && compiler.webpack.version || '4.x';
    /** 构建模式，'development' | 'production' */
    // const { mode } = compiler.options;

    compiler.hooks.afterEnvironment.tap('I18nToolWebpackPlugin', () => {
      // this.modifyVueLoaderOptions(compiler);
      this.addJsonLoader(compiler);
      this.addI18nToolLoader(compiler);
    });

    this.checkEntriesAtBuildDone(compiler);
  }

  modifyVueLoaderOptions(compiler) {
    // VueLoaderPlugin也许会修改到
    // vue-template-compiler v2.6.14，模板中有注释的节点，默认会移除，无需手动修改
    // 文档：https://github.com/vuejs/vue/blob/dev/packages/vue-template-compiler/README.md
    const vueRuleIndex = compiler.options.module.rules.findIndex(rule => {
      return rule.test && rule.test.toString().includes('.vue$');
    });
    console.log('\nvueRuleIndex', vueRuleIndex);
    if (vueRuleIndex !== -1) {
      const vueLoader = compiler.options.module.rules[vueRuleIndex].use.find(
        loader => loader.loader && loader.loader.includes('vue-loader')
      );
      console.log('\nvueLoader before', vueLoader);
      if (vueLoader) {
        vueLoader.options = vueLoader.options || {};
        vueLoader.options.compilerOptions = vueLoader.options.compilerOptions || {};
        vueLoader.options.compilerOptions.comments = false;
      }
      console.log('\nvueLoader after', vueLoader);
    }
  }

  /** 在构建结束时检查是否有未被提取的词条 */
  checkEntriesAtBuildDone(compiler) {
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

  addJsonLoader(compiler) {
    const jsonRuleIndex = compiler.options.module.rules.findIndex(rule => {
      return rule.test && rule.test.toString().includes('.json$');
    });
    console.log('\njsonRuleIndex', jsonRuleIndex, '\n');
    if (jsonRuleIndex !== -1 && 0) {
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
        enforce: 'post', // 使用post确保在其他loader之后执行
        loader: path.resolve(__dirname, 'loader.cjs'),
        options: {
          // 自定义loader的选项
        }
      });
    } else {
      // 已兼容webpack v4和v5
      const jsonRule = {
        test: /\.json$/,
        // 必须设置type: 'javascript/auto'，把json文件解析成js esm模块，否则会报错：Module parse failed: Unexpected token (1:0)
        type: 'javascript/auto',
        use: [
          {
            loader: path.resolve(__dirname, 'jsonLoader.cjs'),
            options: {}
          }
        ]
      };
      compiler.options.module.rules.push(jsonRule);
    }
  }

  addI18nToolLoader(compiler) {
    const i18nToolLoader = {
      test: /\.(vue|js|cjs|mjs|json)$/,
      // 使用post确保在其他loader之后执行
      enforce: 'post',
      loader: path.resolve(__dirname, 'loader.cjs'),
      options: {}
    };

    // if (vueRuleIndex !== -1) {
    //   // 插入到vue-loader规则之后
    //   compiler.options.module.rules.splice(vueRuleIndex + 1, 0, customLoaderRule);
    // } else {
    //   compiler.options.module.rules.push(customLoaderRule);
    // }

    compiler.options.module.rules.push(i18nToolLoader);
  }
}

module.exports = I18nToolWebpackPlugin;
