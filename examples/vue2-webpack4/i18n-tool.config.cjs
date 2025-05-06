const KEY = require('../../lib/key.json');

module.exports = {
  // targetLangs: ['en-US', 'es-MX', 'id-ID'],
  targetLangs: ['en-US', 'zh-CN'],
  runtimeTargetLangConfig: {
    china_test: ['zh-CN', 'en-US'],
    china_prod: ['zh-CN'],
    indonesia_test: ['id-ID'],
    indonesia_prod: ['id-ID']
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
