module.exports = {
  // targetLangs: ['en-US', 'es-MX', 'id-ID'],
  targetLangs: ['en-US', 'zh-CN'],
  i18nDir: 'src/i18n',
  i18nAlias: '@/i18n/index.js',
  tempDir: 'i18nToolTemp',
  dirs: ['src', 'node_modules/@fake-npm/lib'],
  // dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  // include: ['**/*.{js,cjs,mjs,json,vue,ts,tsx,jsx}'],
  // include: ['src/mockEntry.json'],
  exclude: []
};
