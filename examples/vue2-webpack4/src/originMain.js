import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { i18n } from '@/i18n/index.js';

Vue.config.productionTip = false;
console.log(`当前语言：${i18n.currentLanguage}`);
new Vue({
  router,
  store,
  i18n: i18n.instance,
  render: h => h(App)
}).$mount('#app');
