const { defineConfig } = require('@vue/cli-service');
const I18nToolWebpackPlugin = require('@rainbow556/i18n-tool/lib/plugin/webpack/plugin.cjs');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new I18nToolWebpackPlugin()]
  },
  chainWebpack(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions = options.compilerOptions || {};
        options.compilerOptions.comments = false;
        return options;
      })
      .end();
  },
  devServer: {
    port: 8084
  }
});
