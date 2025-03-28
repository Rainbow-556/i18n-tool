const { execSync } = require('child_process');
const path = require('path');

// 获取项目根目录
const projectRoot = execSync('git rev-parse --show-toplevel').toString().trim();

// 获取暂存文件列表（相对路径）
const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

// 转换为完整路径
const fullPaths = stagedFiles.map(file => path.join(projectRoot, file));

console.log('\nstagedFiles\n', stagedFiles.join(', '));
console.log('\nfullPaths\n', fullPaths.join(', '));

setTimeout(() => {
  process.exit(1);
}, 10000);
