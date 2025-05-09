import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { i18n } from '@/i18n/index.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

Vue.config.productionTip = false;
Vue.config.ignoredElements = [
  // 如果有其他自定义元素，也在这里添加
  /^(wc|sl)-/
];

new Vue({
  router,
  store,
  i18n: i18n.instance,
  render: h => h(App)
}).$mount('#app');

// initI18n().then(() => {
//   console.log('i18n 初始化完成');
//   import('./originMain.js');
// });
