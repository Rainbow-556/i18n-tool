<script lang="tsx">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const count = ref<number>(0);
    const greeting = ref<string>('Hello Vue 3 with TSX!');

    const increment = () => {
      count.value++;
    };

    return () => (
      <div>
        <h1>{greeting.value}</h1>
        {/* todo jsx以下语法会编译成 [_createTextVNode("Count is: "), count.value])，待处理*/}
        <button onClick={increment}>
          Count is: {count.value}
          {count.value + '2236667'}
          <div>div</div>
        </button>
        <button onClick={increment}>{`Count is: ${count.value}`}</button>
      </div>
    );
  }
});
</script>

<style scoped>
button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
