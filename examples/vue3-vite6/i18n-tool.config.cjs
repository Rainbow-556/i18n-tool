// vite中如何获取.env变量？
const { loadEnv } = require('vite');

// 获取当前模式（development/production）
const mode = process.env.NODE_ENV || 'development';

// 加载环境变量（自动读取.env和.env.[mode]文件）
const env = loadEnv(mode, process.cwd(), 'VITE_');
console.log('env', env);

module.exports = {
  // targetLangs: ['en-US', 'es-MX', 'id-ID'],
  targetLangs: ['en-US', 'zh-CN'],
  i18nDir: 'src/i18n',
  i18nAlias: '@/i18n/index.js',
  tempDir: 'i18nToolTemp',
  dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  // include: ['**/*.{js,cjs,mjs,json,vue,ts,tsx,jsx}'],
  // include: ['src/mockEntry.json'],
  exclude: ['node_modules/**']
};
