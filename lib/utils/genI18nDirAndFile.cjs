const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');

function genI18nDirAndFile() {
  genLangPackDirAndFileIfNeed('calibrated');
  genLangPackDirAndFileIfNeed('uncalibrated');
  genIndexJS();
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

function genIndexJS() {
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
  genI18nDirAndFile
};
