const { KEY } = require('../../../lib/key.cjs');

const jsonObj1 = {
  a: 'a',
  b: {
    c: 'c',
    e: {
      f: 'f',
      g: ['', 'g2'],
      h: [{ h1: '' }]
    }
  }
};

const jsonObj = {
  a: 'a',
  '846d79ea71304e68c2c6cf48a8ad8028': '中文中文中文中文2 {p0}',
  '7d648b374134d2f2735fdf3898657346': '模板字符串{p0}',
  '5f2d66d99b37a6d869c6b2f5d86102fc': '英文 中文',
  '46c68f4038b0721fe1b7a706ef09135b': 'cjs的generateKey',
  '08c51326bb75810ac77b9f7707453674': '数据{p0}和{p1}',
  '0f481397f36836c17e01c47429088830': '头部{p0}尾部',
  '81125bd228283891d0afce91e9a96a39': '环境变量{p0}',
  '1b4d72e7cd185793fb9edcea4417c920': '独立的块',
  dd76a8584cd943ac43c1beeb715c0e63: '独立的块IndependentBlock created',
  fa014d465b321f70bcada72f034c248f: '来自.cjs a={p0}str{p1}',
  b1e3a7176fe2dc87801ec157684db037: '{p0}来自.js{p1}',
  b5f7e00a2a85e8414929b332e5bc0bb2: '来自.json',
  ecbff9e2f9776daaf1c8533c4ff16d2e: '来自.mjs{p0}',
  '4baad04b1de629553d9e69935d083117': '当前语言：{p0}',
  '81fcfc3033e09598e16ab34818e67a41': '新的模块3',
  '7dff31b4bf8162e38ba1ca6148113e9e': '来自fake.json的文本',
  ada52ab02713df567068cd65526e7026: '来自fake的组件',
  f6da36b54ab04addfe0435f8753d5ebe: 'fake的消息',
  '97d9ccfa511ca67c9c26b078313294df': 'fake的created钩子',
  '15b053cf2354596aad8d964a71185db9': '切换{p0}',
  d6703c346c4de74354eaedaddb5f13b9: '文案3',
  '20414fc5b9c3eb7b5853f58f02bcbf49': '中文中文中文中文 {p0}'
};

async function test() {
  const { jsonStringHandler } = await import('./jsonStringHandler.js');
  jsonStringHandler.init({
    targetLang: 'en-US',
    translatorName: 'baidu',
    translatorOptions: {
      appId: KEY.BAIDU_APP_ID,
      secretKey: KEY.BAIDU_SECRET_KEY
    },
    timeout: 3000
  });
  jsonStringHandler
    .handle(jsonObj)
    .then(result => {
      console.log('result');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.log('err');
      console.log(err);
    });
}

test();
