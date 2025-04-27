const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');
const { getUIFramework, getVueVersion } = require('./package.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');

function genI18nDirAndFile() {
  try {
    genLangPackDirAndFileIfNeed('calibrated');
    genLangPackDirAndFileIfNeed('uncalibrated');
    genI18nFrameworkJS();
    genIndexJS();
  } catch (e) {
    chalkLog('error', 'genI18nDirAndFile()失败', e.message);
    process.exit(1);
  }
}

function genLangPackDirAndFileIfNeed(dir) {
  const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  [i18nToolConfig.originLang, ...i18nToolConfig.targetLangs].forEach(lang => {
    const filePath = path.resolve(i18nToolConfig.i18nDir, dir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf-8');
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
    fs.writeFileSync(jsPath, js, 'utf-8');
  }
}

function genVue3I18nFrameworkJS() {
  return `
import { createI18n } from 'vue-i18n';

const pluginInstance = createI18n({
  legacy: false,
  locale: '${i18nToolConfig.runtimeTargetLangs[0]}',
  fallbackLocale: '${i18nToolConfig.runtimeTargetLangs[0]}'
});

const i18nFramework = {
  i18nInstance: pluginInstance,
  t(...args) {
    return pluginInstance.global.t(...args);
  },
  addLocale({ locale, langPack }) {
    pluginInstance.global.setLocaleMessage(locale, langPack);
  },
  switchLocale({ locale, reload }) {
    const currentLocale = this.currentLocale();
    if (currentLocale === locale) {
      return;
    }
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
    // pluginInstance.global.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangConfig的顺序，保持一致
    return ['${i18nToolConfig.runtimeTargetLangs.join("', '")}'];
  },
  currentLocale() {
    if (pluginInstance.mode === 'legacy') {
      return pluginInstance.global.locale;
    } else {
      return pluginInstance.global.locale.value;
    }
  }
}

export default i18nFramework;
`;
}

function genVue2I18nFrameworkJS() {
  return `
import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const pluginInstance = new VueI18n({
  locale: '${i18nToolConfig.runtimeTargetLangs[0]}',
  fallbackLocale: '${i18nToolConfig.runtimeTargetLangs[0]}'
});

const i18nFramework = {
  i18nInstance: pluginInstance,
  t(...args) {
    return pluginInstance.t(...args);
  },
  addLocale({ locale, langPack }) {
    pluginInstance.setLocaleMessage(locale, langPack);
  },
  switchLocale({ locale, reload }) {
    const currentLocale = this.currentLocale();
    if (currentLocale === locale) {
      return;
    }
    localStorage.setItem('i18n-tool-locale', locale);
    if (reload) {
      window.location.reload();
    } else {
      pluginInstance.locale = locale;
    }
  },
  availableLocales() {
    // pluginInstance.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangConfig的顺序，保持一致
    return ['${i18nToolConfig.runtimeTargetLangs.join("', '")}'];
  },
  currentLocale() {
    return pluginInstance.locale;
  }
}

export default i18nFramework;
`;
}

function genIndexJS() {
  // todo 目前切换语言时会刷新页面，初始化时只添加默认语言包，其他的语言包使用空的占位，减少网络请求
  const importStatements = ['// 该文件是构建时自动生成的，请勿修改！！！', `import i18n from './i18nFramework.js';`];
  const otherStatements = [];
  const langs = [];
  i18nToolConfig.runtimeTargetLangs.forEach(lang => {
    langs.push(lang);
    const langValName = lang.replace(/\-/g, '_');
    const langPackCalibratedName = `${langValName}_calibrated`;
    const langPackUncalibratedName = `${langValName}_uncalibrated`;
    importStatements.push(`import ${langPackCalibratedName} from './calibrated/${lang}.json';`);
    importStatements.push(`import ${langPackUncalibratedName} from './uncalibrated/${lang}.json';`);

    otherStatements.push(`Object.assign(${langPackUncalibratedName}, ${langPackCalibratedName});`);
    otherStatements.push(`i18n.addLocale({ locale: '${lang}', langPack: ${langPackUncalibratedName} });`);
  });

  otherStatements.push(`
const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale({ locale, reload: false });
} else {
  localStorage.removeItem('i18n-tool-locale');
  i18n.switchLocale({ locale: i18n.availableLocales()[0], reload: false });
}`);
  otherStatements.push(`export const i18nFramework = i18n;`);

  const js = importStatements.join('\n') + '\n\n' + otherStatements.join('\n');
  const indexJSPath = path.resolve(i18nToolConfig.i18nDir, 'index.js');
  if (fs.existsSync(indexJSPath)) {
    const oldJS = fs.readFileSync(indexJSPath, 'utf-8').toString();
    if (js === oldJS) {
      // console.log(`${i18nToolConfig.i18nDir}/index.js 无变化，无需更新`);
      return;
    }
  }
  fs.writeFileSync(indexJSPath, js, 'utf-8');
}

module.exports = {
  genI18nDirAndFile
};
