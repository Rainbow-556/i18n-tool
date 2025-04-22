import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { i18nFramework } from '@/i18n/index.js';

createApp(App).use(i18nFramework.i18nInstance).use(store).use(router).mount('#app');
