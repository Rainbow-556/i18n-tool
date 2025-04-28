
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
