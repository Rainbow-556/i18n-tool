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
  dirs: ['src', 'node_modules/@fake-npm/lib'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  // include: ['**/*.{js,cjs,mjs,json,vue,ts,tsx,jsx}'],
  // include: ['src/mockEntry.json'],
  exclude: [],
  translator: {
    name: 'baidu',
    options: {
      appId: KEY.BAIDU_APP_ID,
      secretKey: KEY.BAIDU_SECRET_KEY,
      apiKey: KEY.DEEP_SEEK_API_KEY
    }
  }
};
