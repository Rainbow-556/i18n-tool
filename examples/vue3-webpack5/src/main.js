import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { i18n } from '@/i18n/index.js';

createApp(App).use(i18n.instance).use(store).use(router).mount('#app');
