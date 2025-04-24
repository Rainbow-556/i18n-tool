<template>
  <div class="home">来自fake的组件</div>
</template>

<script>
export default {
  name: 'Fake',
  components: {},
  data() {
    return {
      msg: 'fake的消息'
    };
  },
  created() {
    console.log('fake的created钩子');
  }
};
</script>
