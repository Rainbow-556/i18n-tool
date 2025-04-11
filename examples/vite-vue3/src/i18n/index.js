// 该文件自动生成的，勤务修改！！！
import i18n from './i18nFramework.js';
import zh_CN_calibrated from './calibrated/zh-CN.json';
import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';
import en_US_calibrated from './calibrated/en-US.json';
import en_US_uncalibrated from './uncalibrated/en-US.json';

Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
i18n.addLocale('zh-CN', zh_CN_uncalibrated);
Object.assign(en_US_uncalibrated, en_US_calibrated);
i18n.addLocale('en-US', en_US_uncalibrated);

const locale = localStorage.getItem('i18n-tool-locale');
if (locale && i18n.availableLocales().includes(locale)) {
  i18n.switchLocale(locale, false);
} else {
  localStorage.removeItem('i18n-tool-locale');
}
export const i18nFramework = i18n;