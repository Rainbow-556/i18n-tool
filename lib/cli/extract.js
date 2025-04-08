const fs = require('fs').promises;
const path = require('path');
const micromatch = require('micromatch');
const { traverseFiles } = require('../traverseFiles.cjs');
const { getStagedFiles, getStagedFileContent } = require('../utils/stagedFile.cjs');
const { compileToJS } = require('../compileToJS/index.cjs');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { extractEntry } = require('../utils/extractEntry.cjs');
const i18nToolConfig = require(path.resolve('i18n-tool.config.cjs'));
// console.log('i18nToolConfig', i18nToolConfig);

async function extract({ staged }) {
  console.log('extract start', staged, process.cwd(), '\n');
  await codeFormatter.init();
  // todo 加载已校准、待校准的语言包

  async function fileCallback(absolutePath) {
    // 读取文件内容
    let content;
    if (staged && 0) {
      content = getStagedFileContent(absolutePath);
    } else {
      content = await fs.readFile(absolutePath, 'utf-8');
    }

    // 把所有文件编译成js
    const resultCodes = compileToJS(absolutePath, content);
    console.log('\n--------');
    console.log('absolutePath', absolutePath);
    for (let i = 0; i < resultCodes.length; i++) {
      console.log(`\n---resultCode ${i + 1}---\n`);
      console.log(resultCodes[i]);
    }
    console.log('\n--------');

    // 使用biome格式化
    const formattedResultCodes = [];
    for (let i = 0; i < resultCodes.length; i++) {
      const code = codeFormatter.format(resultCodes[i]);
      formattedResultCodes.push(code);
      console.log(`\n---formattedResultCode ${i + 1}---\n`);
      console.log(code);
    }

    // 使用babel提取词条
    const zhMap = {};
    for (let i = 0; i < formattedResultCodes.length; i++) {
      const map = extractEntry(formattedResultCodes[i]);
      Object.assign(zhMap, map);
    }
    console.log('\n---zhMap---\n');
    console.log(zhMap);
    // 提取词条
    // 翻译
    // 生成语言包文件

    // 编译阶段
    // 使用biome格式化
    // 使用babel提取词条
    // 替换成t函数
  }

  if (staged) {
    const stagedFileAbsolutePaths = getStagedFiles();
    for (const absolutePath of stagedFileAbsolutePaths) {
      if (shouldProcessFile(absolutePath, i18nToolConfig)) {
        await fileCallback(absolutePath);
      } else {
        console.log('不在提取词条的文件范围，忽略', absolutePath);
      }
    }
  } else {
    const { dirs, include, exclude } = i18nToolConfig;
    await traverseFiles({ dirs, include, exclude }, fileCallback);
  }

  console.log('\nextract end');
}

function shouldProcessFile(absolutePath, i18nToolConfig) {
  const cwd = process.cwd();
  const { dirs, include, exclude } = i18nToolConfig;
  let isInDirs = false;
  let relativePath;

  for (const dir of dirs) {
    const absoluteDirPath = path.resolve(cwd, dir);
    if (absolutePath.startsWith(absoluteDirPath + path.sep)) {
      isInDirs = true;
      relativePath = path.relative(cwd, absolutePath);
      break;
    } else if (absolutePath === absoluteDirPath) {
      isInDirs = true;
      relativePath = path.relative(cwd, absolutePath);
      break;
    }
  }

  if (!isInDirs) {
    // 不在指定的 dirs 中
    return false;
  }

  if (exclude?.length && micromatch.isMatch(relativePath, exclude)) {
    return false;
  }

  if (include?.length || micromatch.isMatch(relativePath, include)) {
    return true;
  }

  return false;
}

module.exports = { extract };
