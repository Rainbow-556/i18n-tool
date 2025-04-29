import { batchTranslate } from './batchTranslate.js';
import { deepTraverse, setValueByPath } from './utils/json.js';
import { containsChinese, replaceChineseToEncryptedStr } from './utils/containsChinese.js';
import { cache } from './cache/index.js';

// todo 其他翻译器，火山
// 实时翻译要求速度快，只能使用机器翻译
const supportedTranslatorNames = ['baidu'];

export const jsonStringHandler = {
  hasInit: false,
  translator: null,
  translatorName: '',
  translatorOptions: null,
  originLang: '',
  targetLang: '',
  timeout: 3000,
  queue: [],
  isTaskRunning: false,
  init(options) {
    if (this.hasInit) {
      return;
    }
    const { customTranslator, translatorName, translatorOptions, targetLang, timeout = 3000 } = options;
    if (typeof customTranslator === 'object') {
      this.translator = customTranslator;
    } else if (!translatorName) {
      throw new Error(`translatorName is required`);
    } else if (!supportedTranslatorNames.includes(translatorName)) {
      throw new Error(`only support [${supportedTranslatorNames}] translator, but got ${translatorName}`);
    }
    this.hasInit = true;
    this.targetLang = targetLang;
    this.timeout = timeout;
    this.translatorName = translatorName;
    if (translatorName === 'baidu') {
      const { appId, secretKey } = translatorOptions;
      if (!appId || !secretKey) {
        throw new Error(`appId and secretKey are required for baidu translator`);
      }
      this.translatorOptions = { appId, secretKey };
    }
  },
  async handle(jsonObj) {
    if (!this.hasInit) {
      throw new Error('jsonStringHandler not init');
    }
    const pendingTranslateTextInfos = {};
    deepTraverse(jsonObj, (value, path) => {
      if (containsChinese(value)) {
        pendingTranslateTextInfos[value] = { content: value, path, missingLangs: [this.targetLang] };
      }
    });
    if (Object.keys(pendingTranslateTextInfos).length === 0) {
      // 没有需要翻译的文本，直接返回
      return jsonObj;
    }

    return new Promise((resolve, reject) => {
      let handled = false;
      const startTime = Date.now();
      const taskDoneCallback = (translatedResults, isTimeout) => {
        if (handled) {
          return;
        }
        handled = true;
        // 简单深拷贝
        const newJsonObj = JSON.parse(JSON.stringify(jsonObj));
        Object.keys(pendingTranslateTextInfos).forEach(key => {
          const { path, content } = pendingTranslateTextInfos[key];
          let newValue;
          if (translatedResults[key] !== undefined) {
            newValue = translatedResults[key];
          } else {
            // 翻译失败，把原文内的中文替换为密文，保证合规性
            newValue = replaceChineseToEncryptedStr(content);
          }
          setValueByPath(newJsonObj, path, newValue);
        });
        resolve(newJsonObj);
        console.log(`翻译任务${isTimeout ? '超时' : '结束'}, 耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`);
      };

      // 超时处理
      setTimeout(() => {
        // 超时，把原文内的中文替换为密文，保证合规性
        taskDoneCallback({}, true);
      }, this.timeout);

      // 加入队列，等待执行翻译任务
      this.queue.push({ pendingTranslateTextInfos, taskDoneCallback });
      this.execQueue();
    });
  },
  async execQueue() {
    // todo 考虑同时执行多个翻译任务，根据翻译器的qps，提高效率
    if (this.queue.length === 0 || this.isTaskRunning) {
      return;
    }

    this.isTaskRunning = true;
    const { pendingTranslateTextInfos, taskDoneCallback } = this.queue.shift();
    // 从缓存中获取待翻译文本的翻译结果
    // 格式
    // const cachedResults = { '原文1': '译文1', '原文2': '译文2' }
    // const nonCachedResults = ['原文'];
    const { cachedResults, nonCachedResults } = await cache.get({
      texts: Object.keys(pendingTranslateTextInfos).map(key => pendingTranslateTextInfos[key].content),
      targetLang: this.targetLang
    });

    // 过滤出未翻译的文本
    const finalPendingTranslateTextInfos = Object.keys(pendingTranslateTextInfos).reduce((result, key) => {
      if (nonCachedResults.includes(key)) {
        result[key] = pendingTranslateTextInfos[key];
      }
      return result;
    }, {});

    // 批量翻译文本
    // 格式
    // const translatedSuccessResults = {
    //   'zh-CN': [{ key: '原文', content: '译文' }]
    // };
    // const translatedFailResults = {
    //   'zh-CN': [{ key: '原文', content: '原文', errCode: '', errMsg: '' }]
    // };
    const { successResults: translatedSuccessResults, failResults: translatedFailResults } = await batchTranslate({
      originLang: this.originLang,
      pendingTranslateTexts: finalPendingTranslateTextInfos,
      translatorOptions: {
        customTranslator: this.translator,
        name: this.translatorName,
        options: this.translatorOptions
      }
    });
    console.log(`translatedSuccessResults:\n${JSON.stringify(translatedSuccessResults, null, 2)}`);
    console.log(`translatedFailResults:\n${JSON.stringify(translatedFailResults, null, 2)}`);

    if (translatedSuccessResults[this.targetLang]?.length > 0) {
      // 有翻译成功的结果，将翻译结果写入缓存，同步写入内存缓存，再异步写入磁盘缓存
      const translatedTextInfos = translatedSuccessResults[this.targetLang].reduce((result, textInfo) => {
        result[textInfo.key] = textInfo.content;
        return result;
      }, {});
      cache.set({ translatedTextInfos, targetLang: this.targetLang });
      // 将翻译成功的结果与命中缓存的结果合并
      // 格式
      // const translatedResults = { '原文1': '译文1', '原文2': '译文2' };
      const translatedResults = Object.assign({}, cachedResults, translatedTextInfos);
      taskDoneCallback(translatedResults);
    } else {
      // 没有翻译成功的结果，直接返回缓存的结果
      taskDoneCallback(cachedResults);
    }
    this.isTaskRunning = false;
    this.execQueue();
  },
  enqueue(task) {
    this.queue.push(task);
  }
};
