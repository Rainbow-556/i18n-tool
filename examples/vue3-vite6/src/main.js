import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { i18n } from '@/i18n/index.js';
// import ElementPlus from "element-plus";
// import "element-plus/dist/index.css";
import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

console.log('hello vite 你好');
createApp(App).use(i18n.instance).mount('#app');
