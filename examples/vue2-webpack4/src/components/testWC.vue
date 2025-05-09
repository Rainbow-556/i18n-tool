<template>
  <div>
    测试WC组件
    <!-- <wc-view1 :msg="msg3" /> -->
    <wc-view2 ref="view2Ref" :msg="msg" @btn-click="onBtnClick">
      <div slot="name">具名</div>
      <div>默认</div>
    </wc-view2>
  </div>
</template>

<script>
// import '@rainbow556/vue-web-component/wc-view1';
import '@rainbow556/vue-web-component/wc-view2';

let i = 0;

export default {
  data() {
    return {
      msg: 'msg'
    };
  },
  created() {
    console.log(`${this.msg},初始库存大于剩余库存`);
  },
  methods: {
    onBtnClick(e) {
      console.log('onView2BtnClick', e);
      console.log('msg', this.msg);
      this.msg = '你好' + i++;
      console.log('view2Ref.getCount()', this.$refs.view2Ref.getCount());
    }
  }
};
</script>
