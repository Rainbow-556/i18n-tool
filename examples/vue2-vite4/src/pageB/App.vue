<template>
  <div id="app">
    <h1>Page B</h1>
    <h1>Hello, Vue 2 with Vite!</h1>
    <p>This is a Vue 2 project powered by Vite.</p>
    <JSX icon="icon" title="title" />
  </div>
</template>

<script>
import JSX from './jsx.vue';

export default {
  name: 'App',
  components: {
    JSX
  }
};
</script>

<style lang="less" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  h1 {
    background-color: pink;
  }
}
</style>
