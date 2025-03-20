<template>
  <div>
    Vue2SyntaxView
    {{ src }}
    <div>{{ computedB }}</div>
    <div>{{ `${computedB}好啊2` }}</div>
  </div>
</template>

<script>
export default {
  name: "Vue2SyntaxView",
  props: {
    src: {
      type: String,
      default: "src链接",
    },
  },
  data() {
    return {
      a: "字段a",
    };
  },
  computed: {
    computedB() {
      return `computedB${this.a}啊`;
    },
  },
};
</script>

<style lang="scss" scoped></style>
