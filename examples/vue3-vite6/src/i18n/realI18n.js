import { createI18n } from 'vue-i18n';

export function createRealI18n({ locale, fallbackLocale }) {
  return {
    instance: createI18n({
      legacy: false,
      locale,
      fallbackLocale
    }),
    currentLocale() {
      return this.instance.global.locale.value;
    },
    switchLocale(locale) {
      this.instance.global.locale.value = locale;
    },
    setLocaleMessage({ locale, langPack }) {
      this.instance.global.setLocaleMessage(locale, langPack);
    },
    t(...args) {
      return this.instance.global.t(...args);
    }
  };
}
