const { execSync } = require('child_process');
const path = require('path');

function getStagedFiles() {
  // 获取项目根目录
  const projectRoot = execSync('git rev-parse --show-toplevel').toString().trim();
  // 获取暂存文件列表（相对路径）
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);

  // 转换为完整路径
  const absolutePath = stagedFiles.map(file => path.join(projectRoot, file));

  // console.log('\nstagedFiles\n', stagedFiles.join(', '));
  // console.log('\nfullPaths\n', fullPaths.join(', '));
  return absolutePath;
}

function getStagedFileContent(absolutePath) {
  try {
    const projectRoot = execSync('git rev-parse --show-toplevel').toString().trim();
    const filePath = path.relative(projectRoot, absolutePath);
    const content = execSync(`git show :${filePath}`).toString();
    return content;
  } catch (error) {
    console.error(`Error reading staged content of ${filePath}:`, error.message);
    return '';
  }
}

module.exports = { getStagedFiles, getStagedFileContent };
