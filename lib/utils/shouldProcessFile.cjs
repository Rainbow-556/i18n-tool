const path = require('path');
const micromatch = require('micromatch');
const { i18nToolConfig } = require('./i18nToolConfig.cjs');

function shouldProcessFile(absolutePath) {
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
    return false;
  }

  if (exclude?.length && micromatch.isMatch(relativePath, exclude)) {
    return false;
  }

  if (!include?.length || micromatch.isMatch(relativePath, include)) {
    return true;
  }

  return false;
}

module.exports = { shouldProcessFile };
