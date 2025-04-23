import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { i18nFramework } from '@/i18n/index.js';

Vue.config.productionTip = false;
console.log(`当前语言：${i18nFramework.currentLanguage}`);
new Vue({
  router,
  store,
  i18n: i18nFramework.i18nInstance,
  render: h => h(App)
}).$mount('#app');
