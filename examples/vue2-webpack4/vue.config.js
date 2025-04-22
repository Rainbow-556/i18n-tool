const I18nToolWebpackPlugin = require('@rainbow556/i18n-tool/lib/plugin/webpack/plugin.cjs');

module.exports = {
  transpileDependencies: [],
  configureWebpack: {
    plugins: [new I18nToolWebpackPlugin()]
  },
  devServer: {
    port: 8080
  }
};
