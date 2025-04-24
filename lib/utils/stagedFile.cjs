const { execSync } = require('child_process');
const path = require('path');

function getStagedFiles() {
  try {
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
    return [null, absolutePath];
  } catch (e) {
    return [e, null];
  }
}

function getStagedFileContent(absolutePath) {
  try {
    const projectRoot = execSync('git rev-parse --show-toplevel').toString().trim();
    const filePath = path.relative(projectRoot, absolutePath);
    // todo App.vue文件修改时，Windows会报错，macOS不会
    const content = execSync(`git show :${filePath}`).toString();
    return [null, content];
  } catch (e) {
    return [e, null];
  }
}

/** 执行 git add 命令，将指定目录或文件添加到暂存区 */
function addToStaged(fileOrDirPath) {
  try {
    execSync(`git add ${fileOrDirPath}`);
    return [null];
  } catch (e) {
    return [e];
  }
}

module.exports = { getStagedFiles, getStagedFileContent, addToStaged };
