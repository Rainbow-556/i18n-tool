// 该文件自动生成的，请勿修改！！！
import i18n from './i18nFramework.js';
// import en_US_calibrated from './calibrated/en-US.json';
// import en_US_uncalibrated from './uncalibrated/en-US.json';
// import zh_CN_calibrated from './calibrated/zh-CN.json';
// import zh_CN_uncalibrated from './uncalibrated/zh-CN.json';
let en_US_calibrated, en_US_uncalibrated, zh_CN_calibrated, zh_CN_uncalibrated;

export function initI18n() {
  return Promise.all([
    import(/* webpackChunkName: "i18n-lang-pack" */ './calibrated/en-US.json'),
    import(/* webpackChunkName: "i18n-lang-pack" */ './uncalibrated/en-US.json'),
    import(/* webpackChunkName: "i18n-lang-pack" */ './calibrated/zh-CN.json'),
    import(/* webpackChunkName: "i18n-lang-pack" */ './uncalibrated/zh-CN.json')
  ]).then(([enUSCalibratedModule, enUSUncalibratedModule, zhCNCalibratedModule, zhCNUncalibratedModule]) => {
    en_US_calibrated = enUSCalibratedModule.default;
    en_US_uncalibrated = enUSUncalibratedModule.default;
    zh_CN_calibrated = zhCNCalibratedModule.default;
    zh_CN_uncalibrated = zhCNUncalibratedModule.default;

    // The following code should be adjusted to ensure it runs after dynamic imports are completed
    Object.assign(en_US_uncalibrated, en_US_calibrated);
    i18n.addLocale('en-US', en_US_uncalibrated);
    Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
    i18n.addLocale('zh-CN', zh_CN_uncalibrated);

    const locale = localStorage.getItem('i18n-tool-locale');
    if (locale && i18n.availableLocales().includes(locale)) {
      i18n.switchLocale(locale, false);
    } else {
      localStorage.removeItem('i18n-tool-locale');
    }
  });
}

// Object.assign(en_US_uncalibrated, en_US_calibrated);
// i18n.addLocale('en-US', en_US_uncalibrated);
// Object.assign(zh_CN_uncalibrated, zh_CN_calibrated);
// i18n.addLocale('zh-CN', zh_CN_uncalibrated);

// const locale = localStorage.getItem('i18n-tool-locale');
// if (locale && i18n.availableLocales().includes(locale)) {
//   i18n.switchLocale(locale, false);
// } else {
//   localStorage.removeItem('i18n-tool-locale');
// }
export { i18n };
