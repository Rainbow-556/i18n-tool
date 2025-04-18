const { defineConfig } = require('@vue/cli-service');
const I18nToolWebpackPlugin = require('./i18nTool/i18nToolWebpackPlugin');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new I18nToolWebpackPlugin()]
  }
});
