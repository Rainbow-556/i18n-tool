#!/usr/bin/env node
// 调试 node bin/index.js extract 或者 在业务工程下执行 pnpm link 该包的根目录path

const { program } = require('commander');
const { extract } = require('../lib/cli/extract');
const { version } = require('../package.json');

// 添加 extract 命令
program
  .command('extract')
  .option('--staged', '仅提取git暂存区的文件中的词条')
  .description('提取翻译文本')
  .action(options => {
    extract({ staged: options?.staged || false });
  });

// 添加 -v显示版本号
program.option('-v, --version', '显示版本号').action(() => {
  chalk('green', version);
});

// 解析命令行参数
program.parse(process.argv);

function chalk(color, ...args) {
  // chalk v5.0.0 版本开始，是ESModule方式导出的，所以使用 import 导入
  return import('chalk').then(module => {
    const chalk = module.default;
    if (chalk[color]) {
      const coloredText = chalk[color](...args);
      console.log(coloredText);
    } else {
      console.log(...args);
    }
  });
}
