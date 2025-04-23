<template>
  <div id="app">
    中文中文中文中文2

    {{ msg }}
    <div>{{ `模板字符串${msg}` }}</div>
    英文 中文
    <!-- <div>注释的内容-------</div> -->
    <div>{{ t }}</div>
    <div>{{ t2 }}</div>
    <div>{{ envText }}</div>
    <div>{{ envText2 }}</div>
    <button @click="onSwitchBtnClick">切换语言c</button>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
// import '@/fileFormat/ts.ts';
// import '@/fileFormat/jsx.jsx';
// import '@/fileFormat/tsx.tsx';
import { generateKey } from '@/fileFormat/cjs.cjs';
import '@/fileFormat/js.js';
import '@/fileFormat/mjs.mjs';
import json from '@/fileFormat/json.json';
import { i18nFramework } from '@/i18n/index.js';

console.log('json', json);
console.log('cjs的generateKey', generateKey('generateKey'));

const text = '你好';

export default {
  name: 'App',
  data() {
    return {
      msg: `数据${text}和${text}`,
      t: '头部' + text + '尾部',
      name: json[0].name,
      t2: `文案`,
      envText: `环境变量${process.env.VUE_APP_TEXT}`,
      envText2: `${process.env.VUE_APP_TEXT}`
    };
  },
  methods: {
    onSwitchBtnClick() {
      const current = i18nFramework.currentLocale();
      const list = i18nFramework.availableLocales();
      const index = list.indexOf(current);
      const next = index + 1 >= list.length ? 0 : index + 1;
      i18nFramework.switchLocale(list[next], true);
    }
  }
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

#nav {
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
