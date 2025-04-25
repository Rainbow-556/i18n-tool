const path = require('path');
const fs = require('fs');
const { chalkLog } = require('./chalkLog.cjs');

const i18nToolConfig = {
  originLang: 'zh-CN',
  // 所有支持的语言
  targetLangs: [],
  // 运行时支持的语言
  runtimeTargetLangs: [],
  i18nDir: 'src/i18n',
  i18nAlias: '@/i18n/index',
  tempDir: 'i18nToolTemp',
  dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  exclude: ['node_modules/**']
};

loadConfig();
checkConfig();
adjustConfig();

module.exports = {
  i18nToolConfig
};

function loadConfig() {
  const configFilePath = path.resolve('i18n-tool.config.cjs');
  if (!fs.existsSync(configFilePath)) {
    chalkLog('error', `未找到配置文件 ${configFilePath}`);
    process.exit(1);
  }
  const config = require(configFilePath);
  Object.assign(i18nToolConfig, config);
}

function checkConfig() {
  // todo 校验其他配置
  const { i18nDir, i18nAlias, originLang, targetLangs, runtimeTargetLangs } = i18nToolConfig;
  if (!i18nDir) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 i18nDir');
    process.exit(1);
  }
  if (!i18nAlias) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 i18nAlias');
    process.exit(1);
  }
  if (!originLang) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 originLang');
    process.exit(1);
  }
  if (!(targetLangs && targetLangs.length)) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 targetLangs');
    process.exit(1);
  }
  if (!(targetLangs && targetLangs.length)) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 targetLangs');
    process.exit(1);
  }
  if (runtimeTargetLangs && runtimeTargetLangs.length) {
    if (!runtimeTargetLangs.every(lang => targetLangs.includes(lang))) {
      chalkLog('error', `i18n-tool.config.cjs runtimeTargetLangs 不是 targetLangs 的子集`);
      chalkLog('error', `targetLangs: ${targetLangs.join(', ')}`);
      chalkLog('error', `runtimeTargetLangs: ${runtimeTargetLangs.join(', ')}`);
      process.exit(1);
    }
  }
}

function adjustConfig() {
  if (i18nToolConfig.i18nDir.endsWith('/')) {
    // 去除末尾的 /
    i18nToolConfig.i18nDir = i18nToolConfig.i18nDir.slice(0, -1);
  }
  // 暂时只支持源语言为中文
  i18nToolConfig.originLang = 'zh-CN';
  // 排除i18n目录下的所有文件
  i18nToolConfig.exclude.push(i18nToolConfig.i18nDir + '/**');
  // 如果没有配置 runtimeTargetLangs，则默认使用 targetLangs
  if (!(i18nToolConfig.runtimeTargetLangs && i18nToolConfig.runtimeTargetLangs.length)) {
    i18nToolConfig.runtimeTargetLangs = i18nToolConfig.targetLangs;
  }
}
