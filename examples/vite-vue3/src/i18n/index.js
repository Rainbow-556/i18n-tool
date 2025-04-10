import i18n from './i18nFramework.js';
import zh_CN_calibrated from './calibrated/zh-CN.json';
import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';

Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
i18n.addLocale('zh-CN', zh_CN_uncalibrated);

const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale(locale, false);
} else {
  localStorage.removeItem('i18n-tool-locale');
}

export function t(...args) {
  return i18n.t(...args);
};

export const i18nFramework = i18n;