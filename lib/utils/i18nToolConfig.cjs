const path = require('path');
const fs = require('fs');
const { chalkLog } = require('./chalkLog.cjs');

const i18nToolConfig = {
  originLang: 'zh-CN',
  targetLang: null,
  // 所有支持的语言
  allTargetLangs: [],
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

module.exports = { i18nToolConfig };

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
  const { i18nDir, i18nAlias, targetLang, translator } = i18nToolConfig;
  if (!i18nDir) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 i18nDir');
    process.exit(1);
  }
  if (!i18nAlias) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 i18nAlias');
    process.exit(1);
  }
  // if (!originLang) {
  //   chalkLog('error', 'i18n-tool.config.cjs 未配置 originLang');
  //   process.exit(1);
  // }
  if (!targetLang || !Object.keys(targetLang).length) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 targetLang');
    process.exit(1);
  }
  if (!translator) {
    chalkLog('error', 'i18n-tool.config.cjs 未配置 translator');
    process.exit(1);
  }
  if (!translator.customTranslator) {
    if (!translator.name) {
      chalkLog('error', 'i18n-tool.config.cjs 未配置 translator.name');
      process.exit(1);
    }
    if (!['baidu', 'deepSeek', 'volcEngine'].includes(translator.name)) {
      chalkLog('error', `i18n-tool.config.cjs translator.name 仅支持 baidu, deepSeek, volcEngine`);
      process.exit(1);
    }
    if (!translator.options) {
      chalkLog('error', 'i18n-tool.config.cjs 未配置 translator.options');
      process.exit(1);
    }
    if (translator.name === 'baidu' && (!translator.options.baiduAppId || !translator.options.baiduSecretKey)) {
      chalkLog(
        'error',
        'i18n-tool.config.cjs 未配置 translator.options.baiduAppId 或 translator.options.baiduSecretKey'
      );
      process.exit(1);
    }
    if (translator.name === 'deepSeek' && !translator.options.deepSeekApiKey) {
      chalkLog('error', 'i18n-tool.config.cjs 未配置 translator.options.deepSeekApiKey');
      process.exit(1);
    }
    if (
      translator.name === 'volcEngine' &&
      (!translator.options.volcEngineAccessKeyId || !translator.options.volcEngineSecretAccessKey)
    ) {
      chalkLog(
        'error',
        'i18n-tool.config.cjs 未配置 translator.options.volcEngineAccessKeyId 或 translator.options.volcEngineSecretAccessKey'
      );
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
  // 根据环境变量设置 runtimeTargetLangs
  // extract命令执行时，没有设置环境变量，这种情况使用该业务侧支持的所有语言。构建时，设置了环境变量，则使用该环境变量的值动态处理
  initAllTargetLangs();
  const { COUNTRY, ENV } = process.env;
  const langs = (i18nToolConfig.targetLang[COUNTRY] && i18nToolConfig.targetLang[COUNTRY][ENV]) || [];
  i18nToolConfig.runtimeTargetLangs = langs.length ? langs : i18nToolConfig.allTargetLangs;
  if (COUNTRY && ENV && !langs.length) {
    chalkLog('error', `i18n-tool.config.cjs 未配置 targetLang.${COUNTRY}.${ENV}\n中断构建`);
    process.exit(1);
  }
}

function initAllTargetLangs() {
  const { targetLang } = i18nToolConfig;
  const set = new Set();
  for (const country in targetLang) {
    for (const env in targetLang[country]) {
      targetLang[country][env].forEach(lang => {
        set.add(lang);
      });
    }
  }
  set.add(i18nToolConfig.originLang);
  i18nToolConfig.allTargetLangs = [...set];
}
