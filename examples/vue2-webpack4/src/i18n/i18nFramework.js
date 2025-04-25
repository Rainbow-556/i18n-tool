
import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const pluginInstance = new VueI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN'
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
    // pluginInstance.availableLocales是根据词法排序，此处返回i18n-tool.config.cjs中runtimeTargetLangs的顺序，保持一致
    return ['zh-CN', 'en-US'];
  },
  currentLocale() {
    return pluginInstance.locale;
  }
}

export default i18nFramework;
