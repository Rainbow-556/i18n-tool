<template>
  <!-- <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <router-view /> -->
  <div>
    中文中文中文中文2
    <div>{{ `模板字符串${msg}` }}</div>
    英文
    <div>{{ t }}</div>
    <button @click="onSwitchBtnClick">切换语言</button>
  </div>
  <!-- <div>注释的内容-------</div> -->
</template>

<script setup>
// import '@/fileFormat/ts.ts';
// import '@/fileFormat/jsx.jsx';
// import '@/fileFormat/tsx.tsx';
import { ref } from 'vue';
import { generateKey } from '@/fileFormat/cjs.cjs';
import '@/fileFormat/js.js';
import '@/fileFormat/mjs.mjs';
import json from '@/fileFormat/json.json';
import { i18nFramework } from '@/i18n/index.js';

console.log('json', json);
console.log('cjs的generateKey', generateKey('generateKey'));

const text = '你好';
const msg = ref(`数据${text}和${text}`);
const t = ref('头部' + text + '尾部');

const onSwitchBtnClick = () => {
  const current = i18nFramework.currentLocale();
  const list = i18nFramework.availableLocales();
  const index = list.indexOf(current);
  const next = index + 1 >= list.length ? 0 : index + 1;
  i18nFramework.switchLocale(list[next], true);
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
