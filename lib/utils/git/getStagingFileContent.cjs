const { execSync } = require('child_process');
const path = require('path');

function getStagingFileContent(absolutePath) {
  try {
    const projectRoot = execSync('git rev-parse --show-toplevel').toString().trim();
    const filePath = path.relative(projectRoot, absolutePath);
    // git show :filePath 命令需要使用 / 作为路径分隔符，所以需要将 \ 替换为 /
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const content = execSync(`git show :${normalizedFilePath}`).toString();
    return [null, content];
  } catch (e) {
    return [e, null];
  }
}

module.exports = { getStagingFileContent };
