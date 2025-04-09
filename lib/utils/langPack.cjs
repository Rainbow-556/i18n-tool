const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');

const langPack = {
  calibrated: {},
  uncalibrated: {},
  checkMissingLangs(key) {
    const missingLang = [];
    Object.keys(this.calibrated).forEach(lang => {
      if (this.calibrated[lang][key] === undefined && this.uncalibrated[lang][key] === undefined) {
        missingLang.push(lang);
      }
    });
    return missingLang;
  },
  mergeToUncalibratedAndWrite(translatedLangPack) {
    Object.keys(translatedLangPack).forEach(entryKey => {
      const pack = translatedLangPack[entryKey];
      Object.keys(pack).forEach(lang => {
        this.uncalibrated[lang][entryKey] = pack[lang];
      });
    });
    console.log('mergeToUncalibratedAndWrite() uncalibrated:', this.uncalibrated);
    Object.keys(this.uncalibrated).forEach(lang => {
      const dirPath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated', `${lang}.json`);
      fs.writeFileSync(filePath, JSON.stringify(this.uncalibrated[lang], null, 2));
    });
  }
};
[i18nToolConfig.originLang, ...i18nToolConfig.targetLangs].forEach(lang => {
  langPack.calibrated[lang] = {};
  langPack.uncalibrated[lang] = {};
});

loadLangPack('calibrated');
loadLangPack('uncalibrated');

function loadLangPack(dir) {
  try {
    const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
    fs.accessSync(dirPath);
    fs.readdirSync(dirPath).forEach(file => {
      if (file.endsWith('.json')) {
        const lang = file.split('.')[0];
        if (i18nToolConfig.originLang === lang || i18nToolConfig.targetLangs.includes(lang)) {
          langPack[dir][lang] = require(path.resolve(i18nToolConfig.i18nDir, dir, file));
        }
      }
    });
  } catch (error) {
    console.log(`${i18nToolConfig.i18nDir}/${dir} dir not found`);
  }
}

module.exports = {
  langPack
};
