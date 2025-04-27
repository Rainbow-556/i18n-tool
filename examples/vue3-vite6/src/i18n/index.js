// 该文件是构建时自动生成的，请勿修改！！！
import i18n from './i18nFramework.js';
import zh_CN_calibrated from './calibrated/zh-CN.json';
import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';
import en_US_calibrated from './calibrated/en-US.json';
import en_US_uncalibrated from './uncalibrated/en-US.json';

Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
i18n.addLocale({ locale: 'zh-CN', langPack: zh_CN_uncalibrated });
Object.assign(en_US_uncalibrated, en_US_calibrated);
i18n.addLocale({ locale: 'en-US', langPack: en_US_uncalibrated });

const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale({ locale, reload: false });
} else {
  localStorage.removeItem('i18n-tool-locale');
  i18n.switchLocale({ locale: i18n.availableLocales()[0], reload: false });
}
export const i18nFramework = i18n;