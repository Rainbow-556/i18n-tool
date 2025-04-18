module.exports = {
  // targetLangs: ['en-US', 'es-MX', 'id-ID'],
  targetLangs: ['en-US', 'zh-CN'],
  i18nDir: 'src/i18n',
  i18nAlias: '@/i18n/index',
  tempDir: 'i18nToolTemp',
  dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  // include: ['src/mockEntry.json'],
  exclude: ['node_modules/**']
};
