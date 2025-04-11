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
  mergeToUncalibratedAndWrite(translatedLangPack) {
    Object.keys(translatedLangPack).forEach(lang => {
      const pack = translatedLangPack[lang];
      Object.keys(pack).forEach(key => {
        const content = pack[key];
        this.uncalibrated[lang][key] = content;
      });
    });
    console.log('mergeToUncalibratedAndWrite() uncalibrated:', this.uncalibrated);
    Object.keys(this.uncalibrated)
      .filter(lang => Object.keys(translatedLangPack).includes(lang))
      .forEach(lang => {
        const dirPath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.resolve(i18nToolConfig.i18nDir, 'uncalibrated', `${lang}.json`);
        fs.writeFileSync(filePath, JSON.stringify(this.uncalibrated[lang], null, 2));
      });
  }
};

// loadLangPack('calibrated');
// loadLangPack('uncalibrated');

// function loadLangPack(dir) {
//   try {
//     const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
//     fs.accessSync(dirPath);
//     fs.readdirSync(dirPath).forEach(file => {
//       if (file.endsWith('.json')) {
//         const lang = file.split('.')[0];
//         if (i18nToolConfig.originLang === lang || i18nToolConfig.targetLangs.includes(lang)) {
//           langPack[dir][lang] = require(path.resolve(i18nToolConfig.i18nDir, dir, file));
//         }
//       }
//     });
//   } catch (error) {
//     console.log(`${i18nToolConfig.i18nDir}/${dir} dir not found`);
//   }
// }

module.exports = {
  langPack
};
