<template>
  <div>
    测试WC组件
    <!-- <wc-view1 :msg="msg3" /> -->
    <wc-view2
      ref="view2Ref"
      :msgText.prop="msgText"
      :objProperty.prop="objProperty"
      :arrayProperty.prop="arrayProperty"
      @btnClick="onBtnClick"
    >
      <div slot="name">具名</div>
      <div>默认</div>
    </wc-view2>
  </div>
</template>

<script>
// import '@rainbow556/vue-web-component/wc-view1';
// import '@rainbow556/vue-web-component/wc-view2';
import { registerView2, service } from '@rainbow556/vue-web-component';

registerView2();
console.log('service.getName()', service.getName());

let i = 0;

export default {
  data() {
    return {
      msgText: 'msgText',
      arrayProperty: [i],
      objProperty: { a: i }
    };
  },
  created() {},
  methods: {
    onBtnClick(e) {
      console.log('onView2BtnClick', e);
      i++;
      this.msgText = '你好' + i;
      console.log('view2Ref.getCount()', this.$refs.view2Ref.getCount());
      this.arrayProperty.push(i);
      this.objProperty.a = i;
    }
  }
};
</script>
