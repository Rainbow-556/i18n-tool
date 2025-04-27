// 该文件是构建时自动生成的，请勿修改！！！
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { createI18nWrapper } from './i18nFramework.js';
import zh_CN_calibrated from './calibrated/zh-CN.json';
import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';
import en_US_calibrated from './calibrated/en-US.json';
import en_US_uncalibrated from './uncalibrated/en-US.json';

Vue.use(VueI18n);

const i18nWrapper = createI18nWrapper({ locale: '', fallbackLocale: '' });
Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
i18nWrapper.setLocaleMessage({ locale: 'zh-CN', langPack: zh_CN_uncalibrated });
Object.assign(en_US_uncalibrated, en_US_calibrated);
i18nWrapper.setLocaleMessage({ locale: 'en-US', langPack: en_US_uncalibrated });

const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale({ locale, reload: false });
} else {
  localStorage.removeItem('i18n-tool-locale');
  i18n.switchLocale({ locale: i18n.availableLocales()[0], reload: false });
}

export const i18nFramework = {
  wrapper: i18nWrapper,
  t(...args) {
    return i18n.t(...args);
  },
  switchLocale({ locale, reload }) {
    const currentLocale = i18nWrapper.currentLocale();
    if (currentLocale === locale) {
      return;
    }
    localStorage.setItem('i18n-tool-locale', locale);
    if (reload) {
      window.location.reload();
    } else {
      i18nWrapper.switchLocale(locale);
    }
  },
  availableLocales() {
    // pluginInstance.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangConfig的顺序，保持一致
    return ['zh-CN', 'en-US'];
  }
};

// export const i18nFramework = i18n;
