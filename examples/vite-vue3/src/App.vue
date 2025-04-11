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
    <img alt="你好2" />
    <div>{{ hello }}</div>
    <div>{{ b }}</div>
    <div>{{ world2 }}</div>
    <Vue2SyntaxView :src="world2" />
  </div>
  <div>世界22</div>
  <!-- <div v-html="html"></div> -->
  <div>{{ world }}你好56{{ world }}</div>
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
import { test } from '@/test';
import '@/json.json';
import '@/ts.ts';
import '@/jsx.jsx';
import '@/tsx.tsx';
import { ref, computed } from 'vue';
// import HelloWorld from "./components/HelloWorld.vue";
import Vue2SyntaxView from '@/components/vue2SyntaxView.vue';
// import Vue2SyntaxView from "@test/lib/vue2SyntaxView.vue";
// import { i18nFramework } from '@/i18n/index';
// import { useI18n } from "vue-i18n";

// console.log('i18nFramework', i18nFramework.t('hello', { p1: '占位' }));
const b = computed(() => {
  return `${test.value}中文1--------`;
});

// const html = /* i18n-tool-ignore-extract */ '<div>你好</div>';

// const { t } = useI18n();

console.log(test);

const world = '世界1' + '世界2';
const world2 = ref('新的词条');
const world3 = ref('世界2');
const hello = `${world}，世界${b.value}aaa${test.value ? '我+1' : '222'}`;
const hello2 = `${world}，世界${b.value}aaa`;
// const hello3 = `${world}，世界${b}aaa${a}`;
console.log(hello, hello2);
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
