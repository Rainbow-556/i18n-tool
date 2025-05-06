const fs = require('fs').promises;
const path = require('path');
const { i18nToolConfig } = require('../../utils/i18nToolConfig.cjs');
const { genI18nDirAndFile } = require('../../utils/genI18nDirAndFile.cjs');
const { traverseFiles } = require('../../utils/traverseFiles.cjs');
const { getStagedFiles, getStagedFileContent, addToStaged } = require('../../utils/stagedFile.cjs');
const { compileToJS } = require('../../compileToJS/index.cjs');
const { codeFormatter } = require('../../utils/codeFormatter.cjs');
const { extractEntry } = require('../../utils/extractEntry.cjs');
const { shouldProcessFile } = require('../../utils/shouldProcessFile.cjs');
const { langPack } = require('../../utils/langPack.cjs');
const { chalkLog } = require('../../utils/chalkLog.cjs');

/**
 * 提取词条
 * @param {object} options
 * @param {boolean} options.staged true=仅提取git staged中文件的词条，false=根据规则提取所有文件中的词条
 */
async function extract({ staged }) {
  chalkLog('info', `🚀 开始提取${staged ? 'git暂存区' : '全量'}词条...`);

  const [codeFormatterInitErr] = await codeFormatter.init();
  if (codeFormatterInitErr) {
    chalkLog('error', 'codeFormatter.init()失败', codeFormatterInitErr);
    process.exit(1);
  }

  const [langPackInitErr] = langPack.init();
  if (langPackInitErr) {
    chalkLog('error', 'langPack.init()失败', langPackInitErr);
    process.exit(1);
  }

  const stats = {
    entryCount: 0,
    fileCount: {}
  };
  const allEntryKeys = [];
  const pendingTranslateEntry = {};
  const allIgnoredEntries = [];

  async function fileCallback(absolutePath) {
    const segments = absolutePath.split('.');
    const ext = segments[segments.length - 1];
    if (!stats.fileCount[ext]) {
      stats.fileCount[ext] = 0;
    }
    stats.fileCount[ext]++;
    chalkLog('info', `📄 正在解析文件: ${absolutePath}`);
    // 读取文件内容
    let content;
    if (staged) {
      const [err, contentStr] = getStagedFileContent(absolutePath);
      if (err) {
        chalkLog('error', 'getStagedFileContent()失败', err);
        process.exit(1);
      }
      content = contentStr;
    } else {
      content = await fs.readFile(absolutePath, 'utf-8');
    }

    // 把所有文件编译成js
    const [compileToJSErr, resultCodes] = compileToJS(absolutePath, content);
    if (compileToJSErr) {
      chalkLog('error', 'compileToJS()失败', compileToJSErr);
      process.exit(1);
    }
    // console.log('\n--------');
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
      const { entries, ignoredEntries } = extractEntry(formattedResultCodes[i]);
      allIgnoredEntries.push(...ignoredEntries);
      const entryKeys = Object.keys(entries);
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
          content: entries[key],
          missingLangs
        };
      });
    }
  }

  if (staged) {
    const [getStagedFilesErr, stagedFileAbsolutePaths] = getStagedFiles();
    if (getStagedFilesErr) {
      chalkLog('error', 'getStagedFiles()失败', getStagedFilesErr);
      process.exit(1);
    }
    // 文件只是重命名或者移动且文件内容没有变化时，此时获取不到git暂存区的文件，所以此处无需拦截
    // if (stagedFileAbsolutePaths.length <= 0) {
    //   chalkLog('info', '⚠️ git暂存区没有文件');
    //   process.exit(1);
    // }
    for (const absolutePath of stagedFileAbsolutePaths) {
      if (shouldProcessFile(absolutePath)) {
        await fileCallback(absolutePath);
      } else {
        chalkLog('info', `跳过: 不在提取词条的文件范围: ${absolutePath}`);
      }
    }
  } else {
    const { dirs, include, exclude } = i18nToolConfig;
    await traverseFiles({ dirs, include, exclude }, fileCallback);
  }

  // 生成i18n目录和文件
  genI18nDirAndFile();
  if (staged) {
    // genI18nDirAndFile()每次都会生成index.js，所以加入到git暂存区，操作失败也不影响后续流程
    addToStaged(path.resolve(i18nToolConfig.i18nDir, 'index.js'));
  }

  stats.entryCount = Object.keys(pendingTranslateEntry).length;

  chalkLog('data', `📂 文件类型统计:\n${JSON.stringify(stats.fileCount, null, 2)}`);

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
    chalkLog('info', `🌍 开始翻译${stats.entryCount}个词条(翻译中文成目标语言)...`);
    const { batchTranslate } = await import('@rainbow556/translation/lib/translator/batchTranslate.js');
    const translationStartTime = Date.now();
    const translationResult = await batchTranslate({
      originLang: i18nToolConfig.originLang,
      pendingTranslateTexts: pendingTranslateEntry,
      translatorOptions: {
        name: i18nToolConfig.translator.name,
        options: i18nToolConfig.translator.options,
        customTranslator: i18nToolConfig.translator.customTranslator
      }
    });
    const countInfo = Object.keys(pendingTranslateEntry).reduce((result, key) => {
      pendingTranslateEntry[key].missingLangs
        .filter(lang => lang !== i18nToolConfig.originLang)
        .forEach(lang => {
          if (!result[lang]) {
            result[lang] = 0;
          }
          result[lang]++;
        });
      return result;
    }, {});
    chalkLog('data', `📈 翻译量统计(翻译中文成目标语言)\n${JSON.stringify(countInfo, null, 2)}`);
    chalkLog('data', `⏱️ 翻译总耗时${((Date.now() - translationStartTime) / 1000).toFixed(2)}秒`);
    // console.log('translationResult');
    // console.log(JSON.stringify(translationResult, null, 2));
    const { successResults, failResults } = translationResult;

    // 把翻译成功的词条合并到待校准语言包
    langPack.mergeToUncalibrated(successResults);

    if (staged) {
      // 提取暂存区的词条时，把翻译成功的词条写到待校准语言包中
      langPack.write({ types: ['uncalibrated'], langs: Object.keys(successResults) });

      // 把i18nDir整个文件夹加到git暂存区
      const [err] = addToStaged(path.resolve(i18nToolConfig.i18nDir));
      if (err) {
        chalkLog('error', 'addToStaged()失败', err);
        process.exit(1);
      }

      if (Object.keys(failResults).length > 0) {
        chalkLog('error', `❌ 以下词条翻译失败\n${JSON.stringify(failResults, null, 2)}`);
        chalkLog('error', `❌ 词条提取失败`);
        // 中断commit
        process.exit(1);
      } else {
        chalkLog('success', `✅ 所有词条翻译成功`);
        chalkLog('success', `✅ 词条提取成功`);
      }
    } else {
      if (Object.keys(failResults).length > 0) {
        chalkLog('error', `❌ 以下词条翻译失败\n${JSON.stringify(failResults, null, 2)}`);
      } else {
        chalkLog('success', `✅ 所有词条翻译成功`);
        chalkLog('success', `✅ 词条提取成功`);
      }
    }
  } else {
    chalkLog('info', `ℹ️ 没有提取到新词条`);
  }

  if (allIgnoredEntries.length > 0) {
    chalkLog(
      'data',
      `📝 忽略的词条统计 (共 ${allIgnoredEntries.length} 条):\n/* i18n-tool-extract-ignored */\n${JSON.stringify(
        allIgnoredEntries,
        null,
        2
      )}`
    );
  }

  if (!staged) {
    // 全量提取时，删除冗余的词条
    const deleteEntry = langPack.trim(allEntryKeys);
    langPack.write({ types: ['calibrated', 'uncalibrated'] });
    if (deleteEntry) {
      chalkLog('data', `ℹ️ 已清理的冗余词条如下:\n${JSON.stringify(deleteEntry, null, 2)}`);
    }
  }

  // todo 测试
  // fs.writeFile(path.resolve('entryFromExtract.json'), JSON.stringify(pendingTranslateEntry, null, 2), 'utf-8');
}

module.exports = { extract };
