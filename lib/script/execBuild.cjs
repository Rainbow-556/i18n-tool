const { spawn } = require('child_process');
const { parseArgs } = require('./parseArgs.cjs');

const args = parseArgs();
// console.log('parseArgs', args);

// 将解析后的参数设置到环境变量
Object.keys(args).forEach(key => {
  process.env[key] = args[key];
});

// const command = args.BUILD_COMMAND === 'dev' ? 'raw-dev' : 'raw-build';
const child = spawn('pnpm', ['run', args.BUILD_COMMAND], {
  stdio: 'inherit'
});

// child.on('error', error => {
//   console.error(`子进程错误: ${error}`);
// });

// child.on('close', code => {
//   console.log(`子进程退出，代码 ${code}`);
// });
