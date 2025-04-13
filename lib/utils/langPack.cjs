const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');

const langPack = {
  _hasInit: false,
  calibrated: {},
  uncalibrated: {},
  init() {
    if (this._hasInit) {
      return;
    }
    i18nToolConfig.targetLangs.forEach(lang => {
      this.calibrated[lang] = {};
      this.uncalibrated[lang] = {};
    });
    this._loadLangPack('calibrated');
    this._loadLangPack('uncalibrated');
    this._hasInit = true;
  },
  _loadLangPack(dir) {
    try {
      const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
      fs.accessSync(dirPath);
      fs.readdirSync(dirPath).forEach(file => {
        if (file.endsWith('.json')) {
          const lang = file.split('.')[0];
          if (i18nToolConfig.targetLangs.includes(lang)) {
            this[dir][lang] = require(path.resolve(i18nToolConfig.i18nDir, dir, file));
          }
        }
      });
    } catch (error) {
      console.log(`${i18nToolConfig.i18nDir}/${dir} dir not found`);
    }
  },
  checkMissingLangs(key) {
    const missingLang = [];
    Object.keys(this.calibrated).forEach(lang => {
      if (this.calibrated[lang][key] === undefined && this.uncalibrated[lang][key] === undefined) {
        missingLang.push(lang);
      }
    });
    return missingLang;
  },
  mergeToUncalibrated(translatedLangPack) {
    Object.keys(translatedLangPack).forEach(lang => {
      const pack = translatedLangPack[lang];
      Object.keys(pack).forEach(key => {
        const content = pack[key];
        this.uncalibrated[lang][key] = content;
      });
    });
  },
  trim(allEntryKeys) {
    Object.keys(this.calibrated).forEach(lang => {
      Object.keys(this.calibrated[lang])
        .filter(key => !allEntryKeys.includes(key))
        .forEach(key => {
          delete this.calibrated[lang][key];
        });
      Object.keys(this.uncalibrated[lang])
        .filter(key => !allEntryKeys.includes(key))
        .forEach(key => {
          delete this.uncalibrated[lang][key];
        });
    });
  },
  write({ types = ['calibrated', 'uncalibrated'], langs }) {
    Object.keys(this.calibrated)
      .filter(lang => !langs?.length || langs.includes(lang))
      .forEach(lang => {
        if (types.includes('calibrated')) {
          const calibratedFilePath = path.resolve(i18nToolConfig.i18nDir, 'calibrated', `${lang}.json`);
          fs.writeFileSync(calibratedFilePath, JSON.stringify(this.calibrated[lang], null, 2));
        }
        if (types.includes('uncalibrated')) {
          const uncalibratedFilePath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated', `${lang}.json`);
          fs.writeFileSync(uncalibratedFilePath, JSON.stringify(this.uncalibrated[lang], null, 2));
        }
      });
  }
};

module.exports = {
  langPack
};
