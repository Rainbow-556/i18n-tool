const { BaiduTranslator } = require('./baiduTranslator.cjs');
const KEY = require('../../lib/key.json');

module.exports = {
  targetLang: {
    china: {
      test: ['zh-CN', 'en-US'],
      prod: ['zh-CN']
    }
    // indonesia: {
    //   test: ['zh-CN', 'id-ID'],
    //   prod: ['id-ID']
    // },
    // mexico: {
    //   test: ['es-MX', 'zh-CN'],
    //   prod: ['es-MX']
    // }
  },
  i18nDir: 'src/i18n',
  i18nAlias: '@/i18n/index.js',
  tempDir: 'i18nToolTemp',
  dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  // include: ['**/*.{js,cjs,mjs,json,vue,ts,tsx,jsx}'],
  // include: ['src/mockEntry.json'],
  exclude: ['node_modules/**'],
  translator: {
    // customTranslator: new BaiduTranslator(),
    // name: 'deepSeek',
    name: 'baidu',
    // name: 'volcEngine',
    options: {
      baiduAppId: KEY.BAIDU_APP_ID,
      baiduSecretKey: KEY.BAIDU_SECRET_KEY,
      deepSeekApiKey: KEY.DEEP_SEEK_API_KEY,
      volcEngineAccessKeyId: KEY.VOLC_ENGINE_ACCESS_KEY_ID,
      volcEngineSecretAccessKey: KEY.VOLC_ENGINE_SECRET_ACCESS_KEY
    }
  }
};
