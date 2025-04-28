const { spawn } = require('child_process');
const { parseArgs } = require('./parseArgs.cjs');

const args = parseArgs();

// 将解析后的参数设置到环境变量
Object.keys(args).forEach(key => {
  process.env[key] = args[key];
});

// const command = args.BUILD_COMMAND === 'dev' ? 'raw-dev' : 'raw-build';
// 将 pnpm 改为 pnpm.cmd （Windows 的 pnpm 实际上是通过 cmd 文件调用的）
// 显式添加 shell: true 参数，确保使用系统 shell 执行命令
// 这种修改同时保持跨平台兼容性，因为在 macOS/Linux 系统下会自动忽略 .cmd 扩展名
const child = spawn(args.PKG_MANAGER, ['run', args.BUILD_COMMAND], {
  stdio: 'inherit',
  shell: true
});

// child.on('error', error => {
//   console.error(`子进程错误: ${error}`);
// });

// child.on('close', code => {
//   console.log(`子进程退出，代码 ${code}`);
// });
