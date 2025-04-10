const path = require('path');
const fs = require('fs');
const { chalkLog } = require('./chalkLog.cjs');

const i18nToolConfig = {
  originLang: 'zh-CN',
  targetLangs: ['en-US'],
  i18nDir: 'src/i18n',
  dirs: ['src'],
  include: ['**/*.{js,cjs,mjs,json,vue}'],
  exclude: ['node_modules/**']
};

const configFilePath = path.resolve('i18n-tool.config.cjs');
if (!fs.existsSync(configFilePath)) {
  chalkLog('red', `未找到配置文件 ${configFilePath}`);
  process.exit(1);
}

const config = require(configFilePath);
Object.assign(i18nToolConfig, config);

checkConfig();

const { i18nDir } = i18nToolConfig;
i18nToolConfig.exclude.push(i18nDir.endsWith('/') ? i18nDir + '**' : i18nDir + '/**');

module.exports = {
  i18nToolConfig
};

function checkConfig() {
  // todo 校验其他配置
  const { originLang, targetLangs } = i18nToolConfig;
  if (!originLang) {
    chalkLog('red', 'i18n-tool.config.cjs 未配置 originLang');
    process.exit(1);
  }
  if (!targetLangs?.length) {
    chalkLog('red', 'i18n-tool.config.cjs 未配置 targetLangs');
    process.exit(1);
  }
}
