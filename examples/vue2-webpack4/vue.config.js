const I18nToolWebpackPlugin = require('@rainbow556/i18n-tool/lib/plugin/webpack/plugin.cjs');

module.exports = {
  transpileDependencies: [],
  configureWebpack: {
    plugins: [new I18nToolWebpackPlugin()],
    optimization: {
      splitChunks: {
        cacheGroups: {
          i18n: {
            test: /[\\/]src[\\/]i18n[\\/]/,
            name: 'i18n',
            // 同时处理同步（initial）和异步（async）加载的模块
            chunks: 'all',
            // 低于此值的模块不会被拆分，单位为字节（1KB = 1024字节）
            minSize: 500, // 新增最小体积限制（20KB）
            // 值为1时：所有匹配模块都会被拆分，值为2时：至少有2个模块引用时才会被拆分
            minChunks: 1,
            priority: 20,
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  chainWebpack(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.comments = false;
        return options;
      })
      .end();
  },
  devServer: {
    port: 8080
  }
};
