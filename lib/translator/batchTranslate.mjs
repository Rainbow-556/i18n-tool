import { baiduTranslator } from './baiduTranslator.mjs';

async function batchTranslate({ originLang, targetLang, textInfos, translator }) {
  if (textInfos.length === 0) {
    return { translationResults: [] };
  }

  const { maxCharsPerReq, qps } = translator;

  const chunks = [];
  let currentChunk = [];
  let currentChunkCharsLength = 0;

  // 将文本根据maxCharsPerReq组装成chunk，每个chunk就是一个单次调用翻译接口
  for (const textInfo of textInfos) {
    // 加上换行符 \n 的长度
    const potentialNewLength = currentChunkCharsLength + (currentChunk.length > 0 ? 1 : 0) + textInfo.content.length;
    if (potentialNewLength <= maxCharsPerReq) {
      currentChunk.push(textInfo);
      currentChunkCharsLength = potentialNewLength;
    } else {
      chunks.push(currentChunk);
      currentChunk = [textInfo];
      currentChunkCharsLength = textInfo.content.length;
    }
  }
  // 将最后一个chunk添加到 chunks 中
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // console.log('chunks');
  // console.log(JSON.stringify(chunks, null, 2));

  return new Promise(resolve => {
    const translationResults = [];
    let completedCount = 0;
    // 并发请求数量，最多不超过qps
    const initialReqCount = Math.min(chunks.length, qps);
    let currentChunkIndex = 0;
    function processChunk() {
      if (currentChunkIndex >= chunks.length) {
        return;
      }
      const chunk = chunks[currentChunkIndex];
      translator
        .translate(
          originLang,
          targetLang,
          chunk.map(textInfo => textInfo.content)
        )
        .then(res => {
          translationResults.push({ originTextInfos: chunk, translatedTexts: res.translatedTexts, success: true });
        })
        .catch(e => {
          translationResults.push({
            originTextInfos: chunk,
            translatedTexts: [],
            success: false,
            errCode: e.errCode,
            errMsg: e.errMsg
          });
        })
        .finally(() => {
          completedCount++;
          if (completedCount === chunks.length) {
            resolve({ translationResults });
          } else {
            currentChunkIndex++;
            processChunk();
          }
        });
    }
    for (let i = 0; i < initialReqCount; i++) {
      processChunk();
    }
  });
}

// 示例如何使用该函数
async function exampleUsage() {
  const pendingTranslateTexts = {
    a: {
      content: '你好1',
      missingLangs: ['zh-CN', 'en-US']
    },
    b: {
      content: '你好2',
      missingLangs: ['en-US']
    },
    c: {
      content: '你好3，{p0}',
      missingLangs: ['zh-CN', 'en-US']
    }
  };
  // langGroup格式
  // const langGroup = {
  //   'zh-CN': [
  //     {
  //       key: 'a',
  //       content: '你好1'
  //     }
  //   ],
  //   'en-US': [
  //     {
  //       key: 'a',
  //       content: '你好1'
  //     }
  //   ]
  // };
  // 把pendingTranslateTexts中的文本根据lang进行分组
  const langGroup = {};
  Object.keys(pendingTranslateTexts).forEach(key => {
    pendingTranslateTexts[key].missingLangs.forEach(lang => {
      if (!langGroup[lang]) {
        langGroup[lang] = [];
      }
      langGroup[lang].push({ key, content: pendingTranslateTexts[key].content });
    });
  });
  console.log('langGroup');
  console.log(JSON.stringify(langGroup, null, 2));

  const successResults = {};
  const failResults = {};

  // const translator = {
  //   maxCharsPerReq: 20,
  //   qps: 1,
  //   async translate(originLang, targetLang, texts) {
  //     return { translatedTexts: texts };
  //   }
  // };
  const translator = baiduTranslator;

  for (const lang in langGroup) {
    successResults[lang] = {};
    failResults[lang] = [];
    const textInfos = langGroup[lang];
    if (lang === 'zh-CN') {
      // 源语言不需要翻译
      textInfos.forEach(item => {
        successResults[lang][item.key] = item.content;
      });
      continue;
    }

    const validTextInfos = [];
    const invalidTextInfos = [];
    for (const textInfo of textInfos) {
      if (textInfo.content.length > translator.maxCharsPerReq) {
        invalidTextInfos.push(textInfo);
      } else {
        validTextInfos.push(textInfo);
      }
    }

    // 把多个待翻译的文本根据translator的maxCharsPerReq进行分组进行单次接口批量翻译多个文本，每个分组的文本长度总和不能超过maxCharsPerReq
    // translationResults = [{ originTextInfos: [{ key: 'key', content: 'content' }], translatedTexts: ['text'], success: true }]
    const { translationResults } = await batchTranslate({
      originLang: 'zh-CN',
      targetLang: lang,
      textInfos: validTextInfos,
      translator
    });
    console.log('translationResults');
    console.log(JSON.stringify(translationResults, null, 2));
    for (const chunkResult of translationResults) {
      // chunkResult是单次调用翻译接口批量翻译多个文本的结果
      const { originTextInfos, translatedTexts, success } = chunkResult;
      if (!success) {
        // 批量翻译失败
        failResults[lang].push(...originTextInfos);
        continue;
      }
      // 批量翻译成功
      for (let i = 0; i < originTextInfos.length; i++) {
        const { key } = originTextInfos[i];
        successResults[lang][key] = translatedTexts[i];
      }
    }
  }
  console.log('\nsuccessResults');
  console.log(JSON.stringify(successResults, null, 2));
  console.log('\nfailResults');
  console.log(JSON.stringify(failResults, null, 2));
}

exampleUsage();
