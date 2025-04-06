<template>
  <div>
    <h1>{{ greeting }}</h1>
    <button @click="increment">Count is: {{ count }}</button>
    <button @click="increment">{{(greeting as number).toFixed(2)}}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const count = ref<number>(0);
const greeting = ref<string>("Hello Vue 3!");

const increment = () => {
  count.value++;
};
const str = ('1' +1) as string;
</script>
<script lang="ts">
import { ref } from "vue";

const count2 = ref<number>(0);
console.log(count2?.value ?? '1111')
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
