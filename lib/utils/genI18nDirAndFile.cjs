const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');
const { getUIFramework, getVueVersion } = require('./package.cjs');

function genI18nDirAndFile() {
  genLangPackDirAndFileIfNeed('calibrated');
  genLangPackDirAndFileIfNeed('uncalibrated');
  genI18nFrameworkJS();
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

function genI18nFrameworkJS() {
  const jsPath = path.resolve(i18nToolConfig.i18nDir, 'i18nFramework.js');
  // todo 待去除注释
  // if (fs.existsSync(jsPath)) {
  //   return;
  // }
  let js;
  const uiFramework = getUIFramework();
  if (uiFramework === 'vue') {
    const version = getVueVersion();
    if (version.startsWith('3.')) {
      js = genVue3I18nFrameworkJS();
    } else if (version.startsWith('2.')) {
      js = genVue2I18nFrameworkJS();
    }
  } else {
    // todo 其他框架
  }
  if (js) {
    fs.writeFileSync(jsPath, js);
  }
}

function genVue3I18nFrameworkJS() {
  return `
import { createI18n } from 'vue-i18n';

const pluginInstance = createI18n({
  legacy: false,
  locale: '${i18nToolConfig.targetLangs[0]}',
  fallbackLocale: '${i18nToolConfig.targetLangs[0]}'
});

const i18nFramework = {
  i18nInstance: pluginInstance,
  t(...args) {
    return pluginInstance.global.t(...args);
  },
  addLocale(locale, langPack) {
    pluginInstance.global.setLocaleMessage(locale, langPack);
  },
  switchLocale(locale, reload = true) {
    localStorage.setItem('i18n-tool-locale', locale);
    if (reload) {
      window.location.reload();
    } else {
       if (pluginInstance.mode === 'legacy') {
         pluginInstance.global.locale = locale;
       } else {
         pluginInstance.global.locale.value = locale;
       }
    }
  },
  availableLocales() {
    return pluginInstance.global.availableLocales;
  }
}

export default i18nFramework;
`;
}

function genVue2I18nFrameworkJS() {
  return `
import VueI18n from 'vue-i18n';

const pluginInstance = new VueI18n({
  locale: '${i18nToolConfig.targetLangs[0]}',
  fallbackLocale: '${i18nToolConfig.targetLangs[0]}'
});

const i18nFramework = {
  i18nInstance: pluginInstance,
  t(...args) {
    return pluginInstance.t(...args);
  },
  addLocale(locale, langPack) {
    pluginInstance.setLocaleMessage(locale, langPack);
  },
  switchLocale(locale, reload = true) {
    localStorage.setItem('i18n-tool-locale', locale);
    if (reload) {
      window.location.reload();
    } else {
      pluginInstance.locale = locale;
    }
  },
  availableLocales() {
    return pluginInstance.availableLocales;
  }
}

export default i18nFramework;
`;
}

function genIndexJS() {
  const importStatements = ['// 该文件自动生成的，请勿修改！！！', `import i18n from './i18nFramework.js';`];
  const otherStatements = [];
  const langs = [];
  i18nToolConfig.targetLangs.forEach(lang => {
    langs.push(lang);
    const langValName = lang.replaceAll('-', '_');
    const langPackCalibratedName = `${langValName}_calibrated`;
    const langPackUncalibratedName = `${langValName}_uncalibrated`;
    importStatements.push(`import ${langPackCalibratedName} from './calibrated/${lang}.json';`);
    importStatements.push(`import ${langPackUncalibratedName} from './uncalibrated/${lang}.json';`);

    otherStatements.push(`Object.assign(${langPackUncalibratedName}, ${langPackCalibratedName});`);
    otherStatements.push(`i18n.addLocale('${lang}', ${langPackUncalibratedName});`);
  });

  otherStatements.push(`
const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale(locale, false);
} else {
  localStorage.removeItem('i18n-tool-locale');
}`);
  otherStatements.push(`export const i18nFramework = i18n;`);

  const js = importStatements.join('\n') + '\n\n' + otherStatements.join('\n');
  const indexJSPath = path.resolve(i18nToolConfig.i18nDir, 'index.js');
  if (fs.existsSync(indexJSPath)) {
    const oldJS = fs.readFileSync(indexJSPath).toString();
    if (js === oldJS) {
      console.log('index.js 未变化，无需更新');
      return;
    }
  }
  fs.writeFileSync(indexJSPath, js);
}

module.exports = {
  genI18nDirAndFile
};
