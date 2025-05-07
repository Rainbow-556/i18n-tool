<template>
  <div id="app">
    <div>current lang: {{ currentLang }}</div>
    中文中文中文中文

    {{ msg }}
    <div class="css-var">{{ `模板字符串${msg}` }}</div>
    英文 中文
    <!-- <div>注释的内容-------</div> -->
    <div>{{ t }}</div>
    <div>{{ t2 }}</div>
    <div>{{ envText }}</div>
    <div>{{ envText2 }}</div>
    <div>{{ /* i18n-tool-extract-ignored */ '忽略提取的变量' }}</div>
    <Fake />
    <IndependentBlock />
    <button v-for="lang in langs" :key="lang" @click="onSwitchBtnClick(lang)">切换{{ lang }}</button>
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
import { i18n } from '@/i18n/index.js';
import Fake from '@fake-npm/lib/fake.vue';
import FakeJson from '@fake-npm/lib/fake.json';
import IndependentBlock from './components/independentBlock/index.vue';

console.log('json', json);
console.log('FakeJson', FakeJson);
console.log('cjs的generateKey', generateKey('generateKey'));

const text = /* i18n-tool-extract-ignored */ '忽略提取的字符串';
const text2 = /* i18n-tool-extract-ignored */ `忽略提取模板字符串`;

export default {
  name: 'App',
  components: {
    Fake,
    IndependentBlock
  },
  data() {
    return {
      msg: `数据${text}和${text2}`,
      t: '头部' + text + '尾部',
      name: json[0].name,
      t2: `文案312`,
      envText: `环境变量${process.env.VUE_APP_TEXT}`,
      envText2: `${process.env.VUE_APP_TEXT}`,
      langs: i18n.availableLocales(),
      currentLang: i18n.currentLocale()
    };
  },
  methods: {
    onSwitchBtnClick(lang) {
      i18n.switchLocale({ locale: lang, reload: true });
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

.css-var {
  color: var(--my-color);
  position: relative;
  &::after {
    position: absolute;
    right: 0;
    top: 0;
    color: blue;
    content: var(--my-content);
  }
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
