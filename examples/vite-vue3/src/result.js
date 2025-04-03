import {
  createElementVNode as _createElementVNode,
  toDisplayString as _toDisplayString,
  createVNode as _createVNode,
  Fragment as _Fragment,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock
} from 'vue';

import { test } from '@/test';
import { ref, computed } from 'vue';
// import HelloWorld from "./components/HelloWorld.vue";
import Vue2SyntaxView from '@/components/vue2SyntaxView.vue';
// import Vue2SyntaxView from "@test/lib/vue2SyntaxView.vue";
// import { useI18n } from "vue-i18n";

const world = '世界1';

const _sfc_main = {
  __name: 'App',
  setup(__props) {
    // import { a } from "@/i18nPlugin";
    const b = computed(() => {
      return `${test.value}中文2--------`;
    });

    // const { t } = useI18n();

    console.log(test);

    const world2 = ref('世界2');
    const hello = `${world}，世界${b.value}aaa${test.value ? '我+1' : '222'}`;
    const hello2 = `${world}，世界${b.value}aaa`;
    // const hello3 = `${world}，世界${b}aaa${a}`;
    console.log(hello, hello2);

    return (_ctx, _cache) => {
      return (
        _openBlock(),
        _createElementBlock(
          _Fragment,
          null,
          [
            _createElementVNode('div', null, [
              _cache[0] || (_cache[0] = _createElementVNode('img', { alt: '你好' }, null, -1)),
              _createElementVNode('div', null, _toDisplayString(hello)),
              _createElementVNode('div', null, _toDisplayString(b.value), 1),
              _createElementVNode('div', null, _toDisplayString(world2.value), 1),
              _createVNode(Vue2SyntaxView, { src: world2.value }, null, 8, ['src'])
            ]),
            _cache[1] || (_cache[1] = _createElementVNode('div', null, '世界222', -1)),
            _createElementVNode('div', null, `${_toDisplayString(world)}你好56${_toDisplayString(world)}`)
          ],
          64
        )
      );
    };
  }
};

import '/Users/lexin/Desktop/my/work/projects/abroad-middle/i18n-tool/examples/vite-vue3/src/App.vue?vue&type=style&index=0&scoped=1c5146c8&lang.css';

import _export_sfc from 'plugin-vue:export-helper';
export default /*#__PURE__*/ _export_sfc(_sfc_main, [['__scopeId', 'data-v-1c5146c8']]);
