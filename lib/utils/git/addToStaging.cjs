const { execSync } = require('child_process');

/** 执行 git add 命令，将指定目录或文件添加到暂存区 */
function addToStaging(fileOrDirPath) {
  try {
    execSync(`git add ${fileOrDirPath}`);
    return [null];
  } catch (e) {
    return [e];
  }
}

module.exports = { addToStaging };
