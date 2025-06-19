<template>
  <div>
    <h1 class="title">{{ greeting }}</h1>
    <button :class="['btn', 'active']" @click="increment">来自vue3TSSyntaxView Count is: {{ count }}</button>
    <div v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref<number>(1);
const greeting = ref<string>('Hello Vue 3!');

const html = '<div style="color: red;">v-html 你好</div>';

const increment = () => {
  count.value++;
  greeting.value = `greeting值 ${count.value}`;
};
</script>

<style scoped>
button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
