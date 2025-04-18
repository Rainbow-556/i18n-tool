
import VueI18n from 'vue-i18n';

const pluginInstance = new VueI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US'
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
  },
  currentLocale() {
    return pluginInstance.locale;
  }
}

export default i18nFramework;
