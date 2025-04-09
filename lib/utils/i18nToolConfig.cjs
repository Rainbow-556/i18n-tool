const path = require('path');
const fs = require('fs');

// todo 处理默认值，校验，动态添加exclude排除src/i18n目录下的文件
const i18nToolConfig = require(path.resolve('i18n-tool.config.cjs'));

// const i18nToolConfig = {
//   originLang: 'zh-CN',
//   // targetLangList: ['en-US', 'es-MX', 'id-ID'],
//   targetLangList: ['en-US'],
//   i18nDir: 'src/i18n',
//   dirs: ['src'],
//   include: ['**/*.{js,cjs,mjs,json,vue}'],
//   exclude: ['node_modules/**', 'src/i18n/**']
// };

// 生成i18n目录及文件
genI18nDirAndFileIfNeed();

function genI18nDirAndFileIfNeed() {
  genLangPackDirAndFileIfNeed('calibrated');
  genLangPackDirAndFileIfNeed('uncalibrated');
  genIndexJSIfNeed();
}

function genLangPackDirAndFileIfNeed(dir) {
  const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  [i18nToolConfig.originLang, ...i18nToolConfig.targetLangs].forEach(lang => {
    const filePath = path.resolve(i18nToolConfig.i18nDir, dir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}');
    }
  });
}

function genIndexJSIfNeed() {
  const dirPath = path.resolve(i18nToolConfig.i18nDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const indexJSPath = path.resolve(i18nToolConfig.i18nDir, 'index.js');
  // todo 需每次根据lang动态生成import语句，因为lang可能会变化
  // const js = fs.readFileSync(path.resolve(__dirname, '../templateCode/i18nIndex.js')).toString();
  // fs.writeFileSync(indexJSPath, js);
}

module.exports = {
  i18nToolConfig
};
