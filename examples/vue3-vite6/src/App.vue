<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <div>
    <img alt="你好" />
    <div>{{ hello }}</div>
    <div>{{ b }}</div>
    <div>{{ world2 }}</div>
    <Vue2SyntaxView :src="world2" />
  </div>
  <div>世界1</div>
  <!-- <div v-html="html"></div> -->
  <div>{{ world }}你好56{{ world }}</div>
  <button v-for="lang in langs" :key="lang" @click="onSwitchBtnClick(lang)">切换{{ lang }}</button>
  <div>
    <button @click="onAddBtnClick">插入数据</button>
    <button @click="onQueryBtnClick">查询数据</button>
    <!-- <button @click="onRemoveBtnClick">删除数据</button>
    <button @click="onClearBtnClick">清空数据</button> -->
  </div>
  <!-- <img :alt="world2" /> -->
  <!-- <el-button type="primary">你好</el-button> -->
  <!-- <el-button type="primary">{{ world }}</el-button> -->
  <!-- <div>{{ world }}你好{{ world }}</div>
  <div>{{ `你好 ${world}----` }}</div>
  <div>世界</div> -->
  <!-- <HelloWorld :msg="world2" /> -->
</template>

<script setup>
// import { ttttt } from '@/i18n/index';
// import '@/fileFormat/ts.ts';
// import '@/fileFormat/jsx.jsx';
// import '@/fileFormat/tsx.tsx';
// todo vite在dev时引用.cjs会报错，就算是未经过我的插件处理的.cjs文件也会报错，vite不允许在源码中使用require？但是build时不会报错，而且还能正常使用
// import { generateKey } from '@/fileFormat/cjs.cjs';
import '@/fileFormat/js.js';
import '@/fileFormat/mjs.mjs';
import json from '@/fileFormat/json.json';
import { ref, computed } from 'vue';
// import HelloWorld from "./components/HelloWorld.vue";
import Vue2SyntaxView from '@/components/vue2SyntaxView.vue';
// import Vue2SyntaxView from "@test/lib/vue2SyntaxView.vue";
import { i18n } from '@/i18n/index.js';
import { IndexedDBCache } from './cache/indexedDBCache.js';
import { MemoryCache } from './cache/memoryCache.js';
import { Cache } from './cache/index.js';
// import { useI18n } from "vue-i18n";
// import { baiduTranslator } from '@rainbow556/i18n-tool/lib/translator/baiduTranslator.mjs';
// console.log('i18n', i18n.t('hello', { p1: '占位' }));

// console.log('cjs run', generateKey('test'));

const test = ref('123');
const b = computed(() => {
  return `${test.value}中文1--------`;
});

const langs = i18n.availableLocales();

// const html = /* i18n-tool-ignore-extract */ '<div>你好</div>';

// const { t } = useI18n();

console.log('json', json);
console.log('vite define', stringVal, numberVal, objectVal);

const world = '世界1' + '世界2';
const world2 = ref('新的词条1');
const world3 = ref('世界567');
const hello = `${world}，世界${b.value}aaa${test.value ? '我+1' : '222'}`;
const hello2 = `${world}，世界${b.value}aaa`;
// const hello3 = `${world}，世界${b}aaa${a}`;
console.log(hello, hello2);

function onSwitchBtnClick(lang) {
  i18n.switchLocale({ locale: lang, reload: true });
}

const indexedDBCache = new IndexedDBCache({ maxItems: 3 });
const memoryCache = new MemoryCache({ maxItems: 3 });
const cache = new Cache({ maxItems: 3 });

function onAddBtnClick() {
  cache
    .setItems([
      { key: 'test4', age: 123, list: [1, 2] },
      { key: 'test5', age: 123, list: [1, 2, 3] }
      // { key: 'test6', age: 123, list: [1, 2, 3] },
      // { key: 'test7', age: 123, list: [1, 2, 3] }
      // { key: 'test6', age: 1233, list: [1, 2] }
      // { key: 'test4', age: 123, list: [1, 2, 3] }
    ])
    .then(() => {
      console.log('插入成功');
    })
    .catch(err => {
      console.log('err', err);
    });
  // memoryCache.setItems([
  //   { key: 'test4', age: 123, list: [1, 2] },
  //   { key: 'test5', age: 123, list: [1, 2, 3] }
  //   // { key: 'test6', age: 123, list: [1, 2, 3] },
  //   // { key: 'test7', age: 123, list: [1, 2, 3] }
  //   // { key: 'test6', age: 1233, list: [1, 2] }
  //   // { key: 'test4', age: 123, list: [1, 2, 3] }
  // ]);
  // memoryCache.setItems([
  //   { key: 'test4', age: 123, list: [1, 2] },
  //   { key: 'test5', age: 123, list: [1, 2, 3] },
  //   { key: 'test6', age: 123, list: [1, 2, 3] },
  //   { key: 'test7', age: 123, list: [1, 2, 3] }
  //   // { key: 'test6', age: 1233, list: [1, 2] }
  //   // { key: 'test4', age: 123, list: [1, 2, 3] }
  // ]);
  // console.log('插入成功');
}

function onQueryBtnClick() {
  cache
    .getItems(['test4', 'test5', 'test6'])
    .then(res => {
      console.log('查询成功');
      console.log('res', res);
    })
    .catch(err => {
      console.log('err', err);
    });
  // console.log('查询成功');
  // console.log(memoryCache.getItems(['test4', 'test5', 'test6']));
}

// function onRemoveBtnClick() {
//   indexedDBCache
//     .removeItem('test')
//     .then(() => {
//       console.log('删除成功');
//     })
//     .catch(err => {
//       console.log('err', err);
//     });
// }

// function onClearBtnClick() {
//   indexedDBCache
//     .clear()
//     .then(() => {
//       console.log('清除成功');
//     })
//     .catch(err => {
//       console.log('err', err);
//     });
// }
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
