const { defineConfig } = require('@vue/cli-service');
const I18nToolWebpackPlugin = require('@rainbow556/i18n-tool/lib/plugin/webpack/plugin.cjs');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new I18nToolWebpackPlugin()]
  }
});
