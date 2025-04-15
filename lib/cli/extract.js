const fs = require('fs').promises;
const path = require('path');
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { genI18nDirAndFile } = require('../utils/genI18nDirAndFile.cjs');
const { traverseFiles } = require('../utils/traverseFiles.cjs');
const { getStagedFiles, getStagedFileContent } = require('../utils/stagedFile.cjs');
const { compileToJS } = require('../compileToJS/index.cjs');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { extractEntry } = require('../utils/extractEntry.cjs');
const { shouldProcessFile } = require('../utils/shouldProcessFile.cjs');
const { langPack } = require('../utils/langPack.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');

/**
 * 提取词条
 * @param {object} options
 * @param {boolean} options.staged true=仅提取git staged中文件的词条，false=根据规则提取所有文件中的词条
 */
async function extract({ staged }) {
  console.log('extract start', 'staged:', staged, '\n');
  await codeFormatter.init();

  // const { baiduTranslator } = await import('../translator/baiduTranslator.mjs');
  // baiduTranslator.translate('你好{p0}\n我很好\n你好hello\n Vue2SyntaxView你好 {p0} ');

  langPack.init();
  // console.log('langPack', langPack);

  const stats = {
    entryCount: 0,
    fileCount: {}
  };
  const allEntryKeys = [];
  const pendingTranslateEntry = {};

  async function fileCallback(absolutePath) {
    const segments = absolutePath.split('.');
    const ext = segments[segments.length - 1];
    if (!stats.fileCount[ext]) {
      stats.fileCount[ext] = 0;
    }
    stats.fileCount[ext]++;
    // 读取文件内容
    let content;
    // todo 测试
    if (staged && 0) {
      content = getStagedFileContent(absolutePath);
    } else {
      content = await fs.readFile(absolutePath, 'utf-8');
    }

    // 把所有文件编译成js
    const resultCodes = compileToJS(absolutePath, content);
    // console.log('\n--------');
    console.log('transform:', absolutePath);
    // for (let i = 0; i < resultCodes.length; i++) {
    //   console.log(`\n---resultCode ${i + 1}---\n`);
    //   console.log(resultCodes[i]);
    // }
    // console.log('\n--------');

    // 使用biome格式化，把一行中使用 + 号拼接的字符串转成模板字符串
    const formattedResultCodes = [];
    for (let i = 0; i < resultCodes.length; i++) {
      const code = codeFormatter.format(resultCodes[i]);
      formattedResultCodes.push(code);
      // console.log(`\n---formattedResultCode ${i + 1}---\n`);
      // console.log(code);
    }

    // 使用babel提取词条
    for (let i = 0; i < formattedResultCodes.length; i++) {
      const entry = extractEntry(formattedResultCodes[i]);
      const entryKeys = Object.keys(entry);
      allEntryKeys.push(...entryKeys);
      entryKeys.forEach(key => {
        if (pendingTranslateEntry[key] !== undefined) {
          return;
        }
        // 找出src/i18n/(uncalibrated|calibrated)/(zh-CN|en-US).json中不存在的词条，后续再翻译，最后合并到uncalibrated中
        const missingLangs = langPack.checkMissingLangs(key);
        if (missingLangs.length <= 0) {
          return;
        }
        pendingTranslateEntry[key] = {
          content: entry[key],
          missingLangs
        };
      });
    }
  }

  if (staged) {
    const stagedFileAbsolutePaths = getStagedFiles();
    for (const absolutePath of stagedFileAbsolutePaths) {
      if (shouldProcessFile(absolutePath)) {
        await fileCallback(absolutePath);
      } else {
        console.log('不在提取词条的文件范围，忽略', absolutePath);
      }
    }
  } else {
    const { dirs, include, exclude } = i18nToolConfig;
    await traverseFiles({ dirs, include, exclude }, fileCallback);
  }

  // 生成i18n目录和文件
  genI18nDirAndFile();

  stats.entryCount = Object.keys(pendingTranslateEntry).length;

  if (staged) {
    // ❌
    chalkLog('green', `✅ 提取git staged文件的词条完成`);
  } else {
    chalkLog('green', `✅ 提取 [${i18nToolConfig.dirs.join(', ')}] 目录下的词条完成`);
  }
  chalkLog('green', '统计数据');
  chalkLog('green', JSON.stringify(stats, null, 2));
  if (stats.entryCount > 0) {
    chalkLog('green', '词条');
    chalkLog('green', JSON.stringify(pendingTranslateEntry, null, 2));
  }

  // 格式
  // const pendingTranslateEntry = {
  //   fda17c3dba112b56698e0bd590973818: {
  //     content: '你好2',
  //     missingLangs: ['zh-CN', 'en-US']
  //   }
  // };
  // const translatedLangPack = {
  //   'zh-CN': {
  //     '7eca689f0d3389d9dea66ae112e5cfd7': '中文1'
  //   },
  //   'en-US': {
  //     '7eca689f0d3389d9dea66ae112e5cfd7': 'English1'
  //   }
  // };

  if (stats.entryCount > 0) {
    // todo 翻译
    chalkLog('green', `开始翻译 ${stats.entryCount} 个词条...`);
    // const translatedLangPack = Object.keys(pendingTranslateEntry).reduce((result, key) => {
    //   const { content, missingLangs } = pendingTranslateEntry[key];
    //   missingLangs.forEach(lang => {
    //     if (!result[lang]) {
    //       result[lang] = {};
    //     }
    //     result[lang][key] = content;
    //   });
    //   return result;
    // }, {});
    const { batchTranslate } = await import('../translator/batchTranslate.mjs');
    console.log('batchTranslate', batchTranslate);
    const translatedLangPack = await batchTranslate({
      pendingTranslateTexts: pendingTranslateEntry,
      translatorOptions: {
        translator: 'baidu',
        appId: '202104100007717301',
        secretKey: 'KaBWJs471Kt7K8dNYvpt1'
      }
    });
    console.log('translatedLangPack', translatedLangPack);
    return;
    // 合并到待校准语言包
    langPack.mergeToUncalibrated(translatedLangPack);
    // 写到磁盘
    if (staged) {
      langPack.write({ types: ['uncalibrated'], langs: Object.keys(translatedLangPack) });
    }
  }

  if (!staged) {
    // 全量提取时，删除冗余的词条
    langPack.trim(allEntryKeys);
    langPack.write({ types: ['uncalibrated', 'uncalibrated'] });
  }
  chalkLog('green', `词条更新成功`);

  // todo 测试
  fs.writeFile(path.resolve('entryFromExtract.json'), JSON.stringify(pendingTranslateEntry, null, 2));

  console.log('\nextract end');
}

module.exports = { extract };
