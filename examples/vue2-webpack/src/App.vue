<template>
  <div id="app">
    中文中文中文中文 <span>{{ `模板字符串${msg}` }}</span
    >英文
    <!-- <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view/> -->
  </div>
</template>

<script>
import { test } from '@/test';

const text = '你好';

export default {
  name: 'App',
  data() {
    return {
      msg: `数据${text}和${test}`,
      t: '头部' + text + '尾部'
    };
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

nav {
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
