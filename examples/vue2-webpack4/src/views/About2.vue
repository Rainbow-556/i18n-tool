<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script>
import('@/fileFormat/json.json').then(json => console.log('about.vue json', json.default[0]));
console.log('新的模块2');

export default {
  name: 'About'
};
</script>
