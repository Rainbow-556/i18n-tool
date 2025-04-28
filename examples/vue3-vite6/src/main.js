import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { i18n } from '@/i18n/index.js';
// import ElementPlus from "element-plus";
// import "element-plus/dist/index.css";

console.log('hello vite 你好');
createApp(App).use(i18n.instance).mount('#app');
