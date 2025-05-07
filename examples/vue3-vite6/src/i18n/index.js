// 该文件是每次构建时自动生成的，请勿修改！！！
import { createRealI18n } from './realI18n.js';
import zh_CN_calibrated from './calibrated/zh-CN.json';
import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';
import en_US_calibrated from './calibrated/en-US.json';
import en_US_uncalibrated from './uncalibrated/en-US.json';

const realI18n = createRealI18n({ locale: 'zh-CN', fallbackLocale: 'zh-CN' });

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
      // realI18n.instance.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangConfig的顺序，保持一致
      return ['zh-CN', 'en-US'];
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

Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
i18n.setLocaleMessage({ locale: 'zh-CN', langPack: zh_CN_uncalibrated });
Object.assign(en_US_uncalibrated, en_US_calibrated);
i18n.setLocaleMessage({ locale: 'en-US', langPack: en_US_uncalibrated });

const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale({ locale, reload: false });
} else {
  localStorage.removeItem('i18n-tool-locale');
  i18n.switchLocale({ locale: i18n.availableLocales()[0], reload: false });
}

export { i18n };