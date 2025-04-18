const fs = require('fs').promises;
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { compileToJS } = require('../compileToJS/index.cjs');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { extractEntry } = require('../utils/extractEntry.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');
const { getUIFramework } = require('../utils/package.cjs');
const { traverseFiles } = require('../utils/traverseFiles.cjs');

async function stats() {
  // console.log('stats start', '\n');
  await codeFormatter.init();

  const stats = {
    entryCount: 0,
    fileCount: {}
  };
  const zhEntry = {};

  async function fileCallback(absolutePath) {
    const segments = absolutePath.split('.');
    const ext = segments[segments.length - 1];
    if (!stats.fileCount[ext]) {
      stats.fileCount[ext] = 0;
    }
    stats.fileCount[ext]++;
    // 读取文件内容
    const content = await fs.readFile(absolutePath, 'utf-8');

    // 把所有文件编译成js
    const resultCodes = compileToJS(absolutePath, content);
    // console.log('\n--------');
    // console.log('transform:', absolutePath);
    // for (let i = 0; i < resultCodes.length; i++) {
    //   console.log(`\n---resultCode ${i + 1}---\n`);
    //   console.log(resultCodes[i]);
    // }
    // console.log('\n--------');

    // 使用biome格式化
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
      Object.assign(zhEntry, entry);
    }
  }

  const { dirs, include, exclude } = i18nToolConfig;
  await traverseFiles({ dirs, include, exclude }, fileCallback);

  // console.log('\n---zhEntry---\n');
  // console.log(zhEntry);
  stats.entryCount = Object.keys(zhEntry).length;
  // console.log('\n---stats---\n');
  // console.log(stats);

  chalkLog('green', '统计数据');
  chalkLog('green', JSON.stringify(stats, null, 2));
  if (stats.entryCount > 0) {
    chalkLog('green', '词条');
    chalkLog('green', JSON.stringify(zhEntry, null, 2));
  }

  if (stats.entryCount <= 100) {
    const uiFramework = getUIFramework();
    let i18nFramework;
    if (uiFramework === 'vue') {
      i18nFramework = 'vue-i18n';
    } else if (uiFramework === 'react') {
      i18nFramework = 'react-i18next';
    }
    if (uiFramework !== 'unknown') {
      chalkLog('yellow', `\n总词条数少于100条，建议使用直接使用 ${i18nFramework} 进行国际化，无需使用本工具`);
    } else {
      chalkLog('red', `\n未检测到支持的框架，无法自动判断使用哪种国际化框架`);
    }
  } else {
    chalkLog('green', `\n总词条数为${stats.entryCount}条，建议使用本工具进行国际化`);
  }

  console.log('\nstats end');
}

module.exports = { stats };
