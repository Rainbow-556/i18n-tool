const path = require('path');
const micromatch = require('micromatch');
const { i18nToolConfig } = require('../i18nToolConfig.cjs');

const { dirs, include, exclude } = i18nToolConfig;
const cwd = process.cwd();

function shouldProcessFile(absolutePath) {
  let isInDirs = false;
  let relativePath;
  // 标准化路径分隔符，统一使用 / 分隔符
  const normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');

  for (const dir of dirs) {
    const normalizedDirAbsolutePath = path.resolve(cwd, dir).replace(/\\/g, '/');
    if (normalizedAbsolutePath.startsWith(normalizedDirAbsolutePath + '/')) {
      isInDirs = true;
      relativePath = path.relative(cwd, absolutePath);
      break;
    } else if (normalizedAbsolutePath === normalizedDirAbsolutePath) {
      isInDirs = true;
      relativePath = path.relative(cwd, absolutePath);
      break;
    }
  }

  if (!isInDirs) {
    return false;
  }

  // micromatch内部会兼容各平台的路径，所以不需要再处理分隔符
  if (exclude && exclude.length && micromatch.isMatch(relativePath, exclude)) {
    return false;
  }

  if (!(include && include.length) || micromatch.isMatch(relativePath, include)) {
    return true;
  }

  return false;
}

module.exports = { shouldProcessFile };
