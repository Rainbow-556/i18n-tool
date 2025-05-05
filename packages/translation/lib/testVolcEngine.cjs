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
  await import('./translator/test.js');
}

test();
