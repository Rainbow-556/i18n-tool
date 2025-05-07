const path = require('path');
const fs = require('fs');
const { i18nToolConfig } = require('../i18nToolConfig.cjs');
const { getUIFramework, getVueVersion } = require('../package.cjs');
const { chalkLog } = require('../../utils/chalkLog.cjs');

function genI18nDirAndFile() {
  try {
    genLangPackDirAndFileIfNeed('calibrated');
    genLangPackDirAndFileIfNeed('uncalibrated');
    genRealI18nJS();
    genIndexJS();
  } catch (e) {
    chalkLog('error', 'genI18nDirAndFile()失败', e);
    process.exit(1);
  }
}

function genLangPackDirAndFileIfNeed(dir) {
  const dirPath = path.resolve(i18nToolConfig.i18nDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  i18nToolConfig.allTargetLangs.forEach(lang => {
    const filePath = path.resolve(i18nToolConfig.i18nDir, dir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf-8');
    }
  });
}

function genRealI18nJS() {
  const jsPath = path.resolve(i18nToolConfig.i18nDir, 'realI18n.js');
  if (fs.existsSync(jsPath)) {
    return;
  }
  let js;
  const uiFramework = getUIFramework();
  if (uiFramework === 'vue') {
    const version = getVueVersion();
    if (version.startsWith('3.')) {
      js = genRealI18nVue3();
    } else if (version.startsWith('2.')) {
      js = genRealI18nVue2();
    }
  } else {
    // todo 其他框架
  }
  if (js) {
    fs.writeFileSync(jsPath, js, 'utf-8');
  }
}

function genRealI18nVue3() {
  return `
import { createI18n } from 'vue-i18n';

export function createRealI18n({ locale, fallbackLocale }) {
  return {
    instance: createI18n({
      legacy: false,
      locale,
      fallbackLocale
    }),
    currentLocale() {
      return this.instance.global.locale.value;
    },
    switchLocale(locale) {
      this.instance.global.locale.value = locale;
    },
    setLocaleMessage({ locale, langPack }) {
      this.instance.global.setLocaleMessage(locale, langPack);
    },
    t(...args) {
      return this.instance.global.t(...args);
    }
  };
}
`;
}

function genRealI18nVue2() {
  return `
import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export function createRealI18n({ locale, fallbackLocale }) {
  return {
    instance: new VueI18n({
      locale,
      fallbackLocale
    }),
    currentLocale() {
      return this.instance.locale;
    },
    switchLocale(locale) {
      this.instance.locale = locale;
    },
    setLocaleMessage({ locale, langPack }) {
      this.instance.setLocaleMessage(locale, langPack);
    },
    t(...args) {
      return this.instance.t(...args);
    }
  };
}
`;
}

function genIndexJS() {
  const importStatements = [
    '// 该文件是每次构建时自动生成的，请勿修改！！！',
    `import { createRealI18n } from './realI18n.js';`
  ];
  const otherStatements = [];
  otherStatements.push(
    `const realI18n = createRealI18n({ locale: '${i18nToolConfig.runtimeTargetLangs[0]}', fallbackLocale: '${i18nToolConfig.runtimeTargetLangs[0]}' });`
  );
  otherStatements.push(`
const i18n = new Proxy(
  {
    switchLocale({ locale, reload = false }) {
      const currentLocale = realI18n.currentLocale();
      if (currentLocale === locale || !this.availableLocales().includes(locale)) {
        return;
      }
      localStorage.setItem('i18n-tool-locale', locale);
      if (reload) {
        window.location.reload();
      } else {
        realI18n.switchLocale(locale);
      }
    },
    availableLocales() {
      // realI18n.instance.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中targetLang.country.env的顺序，与其保持一致
      return ['${i18nToolConfig.runtimeTargetLangs.join("', '")}'];
    }
  }, 
  {
    get(target, prop) {
      if (prop in target) {
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      }
      const realValue = realI18n[prop];
      return typeof realValue === 'function' ? realValue.bind(realI18n) : realValue;
    },
    set(target, prop, value) {
      if (prop in target) {
        target[prop] = value;
      } else {
        realI18n[prop] = value;
      }
      return true;
    }
  }
);
`);
  const langs = [];
  i18nToolConfig.runtimeTargetLangs.forEach(lang => {
    langs.push(lang);
    const langValName = lang.replace(/\-/g, '_');
    const langPackCalibratedName = `${langValName}_calibrated`;
    const langPackUncalibratedName = `${langValName}_uncalibrated`;
    importStatements.push(`import ${langPackCalibratedName} from './calibrated/${lang}.json';`);
    importStatements.push(`import ${langPackUncalibratedName} from './uncalibrated/${lang}.json';`);

    otherStatements.push(`Object.assign(${langPackUncalibratedName}, ${langPackCalibratedName});`);
    otherStatements.push(`i18n.setLocaleMessage({ locale: '${lang}', langPack: ${langPackUncalibratedName} });`);
  });

  otherStatements.push(`
const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale({ locale, reload: false });
} else {
  localStorage.removeItem('i18n-tool-locale');
  i18n.switchLocale({ locale: i18n.availableLocales()[0], reload: false });
}`);
  otherStatements.push(`\nexport { i18n };`);

  const js = importStatements.join('\n') + '\n\n' + otherStatements.join('\n');
  const indexJSPath = path.resolve(i18nToolConfig.i18nDir, 'index.js');
  if (fs.existsSync(indexJSPath)) {
    const oldJS = fs.readFileSync(indexJSPath, 'utf-8').toString();
    if (js === oldJS) {
      return;
    }
  }
  fs.writeFileSync(indexJSPath, js, 'utf-8');
}

module.exports = { genI18nDirAndFile };
