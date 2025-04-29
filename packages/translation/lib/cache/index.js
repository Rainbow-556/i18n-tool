export const cache = {
  async get({ texts, targetLang }) {
    // 格式
    // const texts = ['原文1'];
    // console.log(`cache.get()\n${targetLang}\ntexts:\n${JSON.stringify(texts, null, 2)}`);
    return {
      // const cachedResults = { '原文1': '译文1', '原文2': '译文2' }
      cachedResults: {},
      nonCachedResults: [...texts]
    };
  },
  async set({ translatedTextInfos, targetLang }) {
    // 格式
    // const translatedTextInfos = { '原文1': '译文1', '原文2': '译文2' }
    // console.log(`cache.set()\n${targetLang}\ntranslatedTextInfos:\n${JSON.stringify(translatedTextInfos, null, 2)}`);
  }
};
