
import { createI18n } from 'vue-i18n';

const pluginInstance = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US'
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
    // pluginInstance.global.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangs的顺序，保持一致
    return ['en-US', 'zh-CN'];
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
