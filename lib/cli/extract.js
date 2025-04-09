const fs = require('fs').promises;
const { traverseFiles } = require('../traverseFiles.cjs');
const { getStagedFiles, getStagedFileContent } = require('../utils/stagedFile.cjs');
const { compileToJS } = require('../compileToJS/index.cjs');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { extractEntry } = require('../utils/extractEntry.cjs');
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { shouldProcessFile } = require('../utils/shouldProcessFile.cjs');
const { langPack } = require('../utils/langPack.cjs');

async function extract({ staged }) {
  console.log('extract start', staged, process.cwd(), '\n');
  await codeFormatter.init();

  console.log('langPack', langPack);

  const stats = {
    entryCount: 0,
    fileCount: {}
  };
  const entry = {};

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
    console.log('absolutePath', absolutePath);
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
      const map = extractEntry(formattedResultCodes[i]);
      Object.keys(map).forEach(key => {
        if (entry[key]) {
          return;
        }
        const missingLangs = langPack.checkMissingLangs(key);
        if (missingLangs.length <= 0) {
          return;
        }
        entry[key] = {
          content: map[key],
          missingLangs
        };
      });
    }

    // 翻译

    // 合并到待校准语言包文件并写到磁盘
    // todo 测试
    const translatedLangPack = {
      '7eca689f0d3389d9dea66ae112e5cfd7': {
        'zh-CN': '中文1',
        'en-US': 'English1'
      }
    };
    langPack.mergeToUncalibratedAndWrite(translatedLangPack);

    // 编译阶段
    // 使用biome格式化
    // 使用babel提取词条
    // 替换成t函数
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
  console.log('\n---entry---\n');
  console.log(entry);
  stats.entryCount = Object.keys(entry).length;
  console.log('\n---stats---\n');
  console.log(stats);
  console.log('\nextract end');
}

module.exports = { extract };
