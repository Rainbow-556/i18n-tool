const jsonObj = {
  a: 'a',
  b: {
    c: 'c',
    e: {
      f: 'f',
      g: ['你好', 'g2'],
      h: [{ h1: 'h1' }]
    }
  }
};

async function test() {
  const { deepTraverse, setValueByPath } = await import('./utils/json.js');
  const { containsChinese } = await import('./utils/containsChinese.js');
  deepTraverse(
    jsonObj,
    (value, path) => {
      console.log('value:', value);
      console.log('path:', path, '\n');
      if (containsChinese(value)) {
        setValueByPath(jsonObj, path, 'newValue');
      }
    },
    []
  );
  console.log('jsonObj:', JSON.stringify(jsonObj, null, 2));
}

test();
