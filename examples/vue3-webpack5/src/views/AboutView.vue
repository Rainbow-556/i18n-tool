<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script setup>
import('@/fileFormat/json.json').then(json => console.log('about.vue json', json.default[0]));
</script>
