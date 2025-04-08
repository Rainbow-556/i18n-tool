<template>
  <div>
    <h1>{{ greeting }}</h1>
    <button @click="increment">Count is: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const count = ref<number>(1);
const greeting = ref<string>("Hello Vue 3!");

const increment = () => {
  count.value++;
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
