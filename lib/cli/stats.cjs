const fs = require('fs').promises;
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { compileToJS } = require('../compileToJS/index.cjs');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { extractEntry } = require('../utils/extractEntry.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');
const { getUIFramework } = require('../utils/package.cjs');
const { traverseFiles } = require('../utils/traverseFiles.cjs');

async function stats() {
  chalkLog('info', '🚀 开始词条统计...');
  const [codeFormatterInitErr] = await codeFormatter.init();
  if (codeFormatterInitErr) {
    chalkLog('error', 'codeFormatter.init()失败', codeFormatterInitErr);
    process.exit(1);
  }

  const stats = {
    entryCount: 0,
    fileCount: {}
  };
  const allEntry = {};

  async function fileCallback(absolutePath) {
    const segments = absolutePath.split('.');
    const ext = segments[segments.length - 1];
    if (!stats.fileCount[ext]) {
      stats.fileCount[ext] = 0;
    }
    stats.fileCount[ext]++;
    chalkLog('info', `📄 正在解析文件: ${absolutePath}`);
    // 读取文件内容
    const content = await fs.readFile(absolutePath, 'utf-8');

    // 把所有文件编译成js
    const [compileToJSErr, resultCodes] = compileToJS(absolutePath, content);
    if (compileToJSErr) {
      chalkLog('error', 'compileToJS()失败', compileToJSErr);
      process.exit(1);
    }
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
      Object.assign(allEntry, entry);
    }
  }

  const { dirs, include, exclude } = i18nToolConfig;
  await traverseFiles({ dirs, include, exclude }, fileCallback);

  stats.entryCount = Object.keys(allEntry).length;

  chalkLog('data', `📂 文件类型统计:\n${JSON.stringify(stats.fileCount, null, 2)}`);

  if (stats.entryCount > 0) {
    chalkLog('data', `📝 词条统计 (共 ${stats.entryCount} 条):\n${JSON.stringify(allEntry, null, 2)}`);
  }

  const minCount = 100;
  if (stats.entryCount <= minCount) {
    const uiFramework = getUIFramework();
    let i18nFramework;
    if (uiFramework === 'vue') {
      i18nFramework = 'vue-i18n';
    } else if (uiFramework === 'react') {
      i18nFramework = 'react-i18next';
    }
    if (uiFramework !== 'unknown') {
      chalkLog(
        'warn',
        `⚠️ 提示: 总词条数少于 ${minCount} 条，建议直接使用 ${i18nFramework} 进行国际化，无需使用本工具`
      );
    } else {
      chalkLog('warn', `⚠️ 提示: 总词条数少于 ${minCount} 条，建议使用标准方案进行国际化，无需使用本工具`);
    }
  } else {
    chalkLog('success', `✅ 总词条数为 ${stats.entryCount} 条，建议使用本工具进行国际化`);
  }
}

module.exports = { stats };
