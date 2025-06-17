// todo 移除languagedetect、franc
const LanguageDetect = require('languagedetect');
const KEY = require('./key.json');

const zh = '中文';
const en = 'English is a wonderful language.';
const fr = 'Français';
const es = 'Español';
const id = 'Bahasa Indonesia';

async function detect() {
  const { franc, francAll } = await import('franc');
  const options = {
    minLength: 1
    // only: []
  };
  console.log('zh', franc(zh, options));
  console.log('en', franc(en, options));
  console.log('fr', franc(fr, options));
  console.log('es', franc(es, options));
  console.log('id', franc(id, options));
  console.log('id2', franc('Alle menslike wesens word vry'));
}

async function detect2() {
  const detector = new LanguageDetect();
  const options = 1;
  console.log('zh', detector.detect(zh, options));
  console.log('en', detector.detect(en, options));
  console.log('fr', detector.detect(fr, options));
  console.log('es', detector.detect(es, options));
  console.log('id', detector.detect(id, options));
}

async function detect3() {
  const { volcEngineTranslator } = await import('@rainbow556/translation/lib/translator/volcEngineTranslator/index.js');
  volcEngineTranslator.setOptions({
    volcEngineAccessKeyId: KEY.VOLC_ENGINE_ACCESS_KEY_ID,
    volcEngineSecretAccessKey: KEY.VOLC_ENGINE_SECRET_ACCESS_KEY
  });
  volcEngineTranslator
    .langDetect({ texts: [zh, en, fr, es, id, 'i like 西瓜', 'jfalsjgsg'] })
    .then(res => {
      console.log('res', res);
    })
    .catch(err => {
      console.log('err', err);
    });
}

detect3();
