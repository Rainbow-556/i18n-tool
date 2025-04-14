async function batchTranslate({ texts, translateApiCall, maxCharsPerReq, qps }) {
  const validTextsToTranslate = [];
  const invalidTexts = [];

  // 过滤掉超过最大字符限制的文本
  for (const text of texts) {
    if (text.length > maxCharsPerReq) {
      invalidTexts.push(text);
    } else {
      validTextsToTranslate.push(text);
    }
  }

  if (validTextsToTranslate.length === 0) {
    return { translationResults: [], invalidTexts };
  }

  const chunks = [];
  let currentChunk = [];
  let currentChunkCharsLength = 0;

  // 将有效的文本组装成批次
  for (const text of validTextsToTranslate) {
    // 加上换行符 \n 的长度
    const potentialNewLength = currentChunkCharsLength + (currentChunk.length > 0 ? 1 : 0) + text.length;
    if (potentialNewLength <= maxCharsPerReq) {
      currentChunk.push(text);
      currentChunkCharsLength = potentialNewLength;
    } else {
      chunks.push(currentChunk);
      currentChunk = [text];
      currentChunkCharsLength = text.length;
    }
  }
  // 将最后一个批次添加到 chunks 中
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  console.log('chunks');
  console.log(JSON.stringify(chunks, null, 2));

  return new Promise(resolve => {
    const translationResults = [];
    let completedCount = 0;
    const initialReqCount = Math.min(chunks.length, qps);
    let currentChunkIndex = 0;
    function processChunk() {
      if (currentChunkIndex >= chunks.length) {
        return;
      }
      const chunk = chunks[currentChunkIndex];
      translateApiCall(chunk)
        .then(res => {
          translationResults.push({ originTexts: chunk, translatedTexts: res.translatedTexts, success: true });
        })
        .catch(e => {
          translationResults.push({
            originTexts: chunk,
            translatedTexts: null,
            success: false,
            errCode: e.errCode,
            errMsg: e.errMsg
          });
        })
        .finally(() => {
          completedCount++;
          if (completedCount === chunks.length) {
            resolve({ translationResults, invalidTexts });
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
  // 模拟翻译 API 调用函数
  async function fakeTranslateApi(text) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    // 这里可以根据 text 的内容返回不同的模拟翻译结果
    return `翻译结果 for: ${text}`;
  }

  const texts = [
    '1234567890',
    '123',
    '12345',
    '这是第三段文本，字数较少。',
    'This is a longer text that might need to be batched with others to stay within the character limit. It should not exceed 5000 characters on its own.',
    'This is an even longer text that will definitely exceed the 5000 character limit and should be skipped and logged.',
    '超越五千字限制的文本，将被跳过并记录。',
    '1234567890',
    '123456789'
  ];

  const pendingTranslateTexts = {
    fda17c3dba112b56698e0bd590973818: {
      content: '你好1',
      missingLangs: ['zh-CN', 'en-US']
    },
    aaa: {
      content: '你好2',
      missingLangs: ['en-US']
    },
    b: {
      content: '你好3',
      missingLangs: ['zh-CN', 'en-US']
    }
  };
  const langGroup = {};
  Object.keys(pendingTranslateTexts).forEach(key => {
    texts.push(pendingTranslateTexts[key].content);
    pendingTranslateTexts[key].missingLangs.forEach(lang => {
      if (!langGroup[lang]) {
        langGroup[lang] = [];
      }
      langGroup[lang].push({ key, content: pendingTranslateTexts[key].content });
    });
  });
  console.log(JSON.stringify(langGroup, null, 2));
  const results = {};
  for (const lang in langGroup) {
    results[lang] = {};
    const textList = langGroup[lang];
    if (lang === 'zh-CN') {
      // 源语言不需要翻译
      textList.forEach(item => {
        results[lang][item.key] = item.content;
      });
      continue;
    }

    // translationResults = [{ originTexts: ['text'], translatedTexts: ['text'], success: true }]
    // invalidTexts = ['text1']
    const { translationResults, invalidTexts } = await batchTranslate({
      texts: textList.map(item => item.content),
      originLang: 'zh',
      targetLang: lang,
      translateApiCall: fakeTranslateApi,
      maxCharsPerReq: 20,
      qps: 1
    });
  }
  console.log('翻译结束');
  console.log(JSON.stringify(results, null, 2));

  // const results = await batchTranslate({ texts, translateApiCall: fakeTranslateApi, maxCharsPerReq: 20, qps: 1 });
  // console.log('翻译结束');
  // console.log(JSON.stringify(results, null, 2));
}

exampleUsage();
