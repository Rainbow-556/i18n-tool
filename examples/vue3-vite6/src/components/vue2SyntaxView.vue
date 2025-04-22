<template>
  <div>
    Vue2SyntaxView你好
    {{ src }}
    <div>{{ computedB }}啊啊啊11</div>
    <div>{{ `${computedB}好啊2` }}</div>
    <div>{{ methodB() }}</div>
  </div>
</template>

<script>
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
      return `computedB${this.a}啊`;
    }
  },
  methods: {
    methodB() {
      return `methodB${this.a}啊`;
    }
  }
};
</script>

<style lang="scss" scoped></style>
