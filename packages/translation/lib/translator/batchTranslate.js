import { baiduTranslator } from './baiduTranslator.js';
import { deepSeekTranslator } from './deepSeekTranslator.js';
import { volcEngineTranslator } from './volcEngineTranslator/index.js';

async function batchTranslateInner({ originLang, targetLang, textInfos, translator }) {
  if (textInfos.length === 0) {
    return { translationResults: [] };
  }

  const {
    maxTextCountPerReq,
    maxCharsPerReq,
    qps,
    putHtmlTextInSeparateChunk = false,
    textDividerCharLength = 0
  } = translator;

  const chunks = [];
  let currentChunk = [];
  let currentChunkCharsLength = 0;

  // 将文本根据maxCharsPerReq组装成chunk，每个chunk就是一个单次调用翻译接口
  for (const textInfo of textInfos) {
    if (putHtmlTextInSeparateChunk && textInfo.content.includes('<')) {
      // content可能是html字符串，单独放到一个chunk中
      chunks.push([textInfo]);
      continue;
    }
    // 加上文本分隔符的长度
    const potentialNewLength =
      currentChunkCharsLength + (currentChunk.length > 0 ? textDividerCharLength : 0) + textInfo.content.length;
    if (potentialNewLength < maxCharsPerReq && currentChunk.length < maxTextCountPerReq) {
      // 如果加上当前文本的长度不超过maxCharsPerReq，并且当前chunk的文本数量不超过maxTextCountPerReq，就将当前文本加入当前chunk
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
      let chunkIndex = currentChunkIndex;
      currentChunkIndex++;
      const chunk = chunks[chunkIndex];
      // console.log(`开始处理第${chunkIndex + 1}个chunk，chunk总数为${chunks.length}`);
      // await new Promise(resolve => setTimeout(resolve, 5000));
      translator
        .translate({
          originLang,
          targetLang,
          texts: chunk.map(textInfo => textInfo.content)
        })
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
          // console.log(`第${chunkIndex + 1}个chunk结束`);
          if (completedCount === chunks.length) {
            resolve({ translationResults });
          } else {
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
export async function batchTranslate({ originLang, pendingTranslateTexts, translatorOptions }) {
  // 格式
  // const pendingTranslateTexts = {
  //   md5_1: {
  //     content: '你好1',
  //     missingLangs: ['zh-CN', 'en-US']
  //   },
  //   md5_2: {
  //     content: '你好2',
  //     missingLangs: ['en-US']
  //   },
  //   md5_3: {
  //     content: '你好3，{p0}',
  //     missingLangs: ['zh-CN', 'en-US']
  //   },
  //   md5_4: {
  //     content: '你好你好你好你好你好你好你好你好你好你好你好你好你好你好4，{p0}',
  //     missingLangs: ['zh-CN', 'en-US']
  //   }
  // };

  // langGroup格式
  // const langGroup = {
  //   'zh-CN': [
  //     {
  //       key: 'md5_1',
  //       content: '你好1'
  //     }
  //   ],
  //   'en-US': [
  //     {
  //       key: 'md5_1',
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
  // console.log('langGroup');
  // console.log(JSON.stringify(langGroup, null, 2));

  const successResults = {};
  const failResults = {};

  const translator = getTranslator(translatorOptions);

  for (const lang in langGroup) {
    successResults[lang] = [];
    failResults[lang] = [];
    const textInfos = langGroup[lang];
    if (lang === originLang) {
      // 源语言不需要翻译
      textInfos.forEach(item => {
        successResults[lang].push({ key: item.key, content: item.content });
      });
      continue;
    }

    const validTextInfos = [];
    for (const textInfo of textInfos) {
      if (textInfo.content.length > translator.maxCharsPerReq) {
        failResults[lang].push({
          ...textInfo,
          errCode: '-100',
          errMsg: `文本长度超过翻译接口的最大字符限制${translator.maxCharsPerReq}`
        });
      } else {
        validTextInfos.push(textInfo);
      }
    }

    // 把多个待翻译的文本根据translator的maxCharsPerReq进行分组进行单次接口批量翻译多个文本，每个分组的文本长度总和不能超过maxCharsPerReq
    // translationResults = [{ originTextInfos: [{ key: 'key', content: 'content' }], translatedTexts: ['text'], success: true }]
    const { translationResults } = await batchTranslateInner({
      originLang,
      targetLang: lang,
      textInfos: validTextInfos,
      translator
    });
    // console.log('translationResults');
    // console.log(JSON.stringify(translationResults, null, 2));
    for (const chunkResult of translationResults) {
      // chunkResult是单次调用翻译接口批量翻译多个文本的结果
      const { originTextInfos, translatedTexts, success, errCode, errMsg } = chunkResult;
      if (!success) {
        // 批量翻译失败
        failResults[lang].push(...originTextInfos.map(item => ({ ...item, errCode, errMsg })));
        continue;
      }
      // 批量翻译成功
      for (let i = 0; i < originTextInfos.length; i++) {
        const { key } = originTextInfos[i];
        successResults[lang].push({ key, content: translatedTexts[i] });
      }
    }
  }
  Object.keys(successResults).forEach(lang => {
    if (successResults[lang].length === 0) {
      delete successResults[lang];
    }
  });
  Object.keys(failResults).forEach(lang => {
    if (failResults[lang].length === 0) {
      delete failResults[lang];
    }
  });
  // console.log('\nsuccessResults');
  // console.log(JSON.stringify(successResults, null, 2));
  // console.log('\nfailResults');
  // console.log(JSON.stringify(failResults, null, 2));
  return { successResults, failResults };
}

function getTranslator(translatorOptions) {
  const { customTranslator, name, options } = translatorOptions;
  if (customTranslator) {
    return customTranslator;
  }
  if (name === 'deepSeek') {
    deepSeekTranslator.setOptions(options);
    return deepSeekTranslator;
  }
  if (name === 'baidu') {
    baiduTranslator.setOptions(options);
    return baiduTranslator;
  }
  if (name === 'volcEngine') {
    volcEngineTranslator.setOptions(options);
    return volcEngineTranslator;
  }
  throw new Error(`不支持的翻译器: ${name}`);
}
