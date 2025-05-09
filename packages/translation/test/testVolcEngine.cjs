const KEY = require('../../../key.json');

async function test() {
  const { volcEngineTranslator } = await import('../lib/translator/volcEngineTranslator/index.js');
  volcEngineTranslator.setOptions({
    volcEngineAccessKeyId: KEY.VOLC_ENGINE_ACCESS_KEY_ID,
    volcEngineSecretAccessKey: KEY.VOLC_ENGINE_SECRET_ACCESS_KEY
  });
  const texts = [];
  for (let i = 0; i < 2; i++) {
    texts.push('你好{p0}，世界{p1}，{p2}' + i);
  }
  const originLang = 'zh-CN';
  const targetLang = 'es-MX';
  volcEngineTranslator
    .translate({ originLang, targetLang, texts })
    .then(res => {
      console.log('res', res);
    })
    .catch(err => {
      console.log('err', err);
    });
}

test();
