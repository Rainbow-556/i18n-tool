const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');
const { chalkLog } = require('./chalkLog.cjs');

const langPack = {
  _hasInit: false,
  calibrated: {},
  uncalibrated: {},
  init() {
    if (this._hasInit) {
      return;
    }
    try {
      i18nToolConfig.targetLangs.forEach(lang => {
        this.calibrated[lang] = {};
        this.uncalibrated[lang] = {};
      });
      this._loadLangPack('calibrated');
      this._loadLangPack('uncalibrated');
      this._hasInit = true;
    } catch (e) {
      chalkLog('error', 'langPack.init()失败', e.message);
      process.exit(1);
    }
  },
  _loadLangPack(dir) {
    const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
    if (!fs.existsSync(dirPath)) {
      return;
    }
    fs.readdirSync(dirPath).forEach(file => {
      if (file.endsWith('.json')) {
        const lang = file.split('.')[0];
        if (i18nToolConfig.targetLangs.includes(lang)) {
          this[dir][lang] = require(path.resolve(i18nToolConfig.i18nDir, dir, file));
        }
      }
    });
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
  mergeToUncalibrated(translatedResults) {
    Object.keys(translatedResults).forEach(lang => {
      const results = translatedResults[lang];
      results.forEach(result => {
        const { key, content } = result;
        this.uncalibrated[lang][key] = content;
      });
    });
  },
  trim(allEntryKeys) {
    let deleteEntry;
    Object.keys(this.calibrated).forEach(lang => {
      Object.keys(this.calibrated[lang])
        .filter(key => !allEntryKeys.includes(key))
        .forEach(key => {
          deleteEntry = deleteEntry || {};
          deleteEntry[lang] = deleteEntry[lang] || {};
          deleteEntry[lang][key] = this.calibrated[lang][key];
          delete this.calibrated[lang][key];
        });
      Object.keys(this.uncalibrated[lang])
        .filter(key => !allEntryKeys.includes(key))
        .forEach(key => {
          deleteEntry = deleteEntry || {};
          deleteEntry[lang] = deleteEntry[lang] || {};
          deleteEntry[lang][key] = this.uncalibrated[lang][key];
          delete this.uncalibrated[lang][key];
        });
    });
    return deleteEntry;
  },
  write({ types = ['calibrated', 'uncalibrated'], langs }) {
    Object.keys(this.calibrated)
      .filter(lang => !(langs && langs.length) || langs.includes(lang))
      .forEach(lang => {
        if (types.includes('calibrated')) {
          const calibratedFilePath = path.resolve(i18nToolConfig.i18nDir, 'calibrated', `${lang}.json`);
          fs.writeFileSync(calibratedFilePath, JSON.stringify(this.calibrated[lang], null, 2), 'utf-8');
        }
        if (types.includes('uncalibrated')) {
          const uncalibratedFilePath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated', `${lang}.json`);
          fs.writeFileSync(uncalibratedFilePath, JSON.stringify(this.uncalibrated[lang], null, 2), 'utf-8');
        }
      });
  },
  mergeCalibrated(newCalibrated) {
    Object.keys(this.calibrated).forEach(lang => {
      const newCalibratedLangPack = newCalibrated[lang] || {};
      const calibratedLangPack = this.calibrated[lang];
      const uncalibratedLangPack = this.uncalibrated[lang];
      Object.keys(newCalibratedLangPack).forEach(key => {
        // 如果未校准的语言包中存在该key，则移除
        if (uncalibratedLangPack[key] !== undefined) {
          delete uncalibratedLangPack[key];
        }
        // 添加到已校准的语言包中
        calibratedLangPack[key] = newCalibratedLangPack[key];
      });
    });
    // console.log('this.calibrated', this.calibrated);
    // console.log('this.uncalibrated', this.uncalibrated);
  }
};

module.exports = {
  langPack
};
