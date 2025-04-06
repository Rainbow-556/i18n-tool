<template>
  <div>
    Vue2SyntaxView
    <!-- {{ src }} -->
    <!-- <div>{{ computedB }}啊啊啊</div> -->
    <!-- <div>{{ `${computedB}好啊2` }}</div>
    <div>{{ methodB() }}</div> -->
    <div>555</div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';

export default {
  name: 'Vue2SyntaxView',
  props: {
    src: {
      type: String,
      default: 'src链接'
    }
  },
  data() {
    return {
      a: '字段a'
    };
  },
  computed: {
    computedB() {
      (this.a as number).toFixed(2);
      return `computedB${this.a}啊`;
    }
  },
  methods: {
    methodB() {
      return `methodB${this.a}啊`;
    }
  },
  render2() {
    return (
      <div class="app">
        <img alt="Vue logo" src={logo} />
        <HelloWorld msg="Welcome to Your Vue.js App"/>
      </div>
    )
  }
};
</script>

<style lang="scss" scoped></style>
