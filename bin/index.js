#!/usr/bin/env node
// 调试 node bin/index.js extract 或者 在业务工程下执行 pnpm link 该包的根目录path

const { program } = require('commander');
const { version } = require('../package.json');
const { extract } = require('../lib/cli/extract');
const { stats } = require('../lib/cli/stats');
const { chalkLog } = require('../lib/utils/chalkLog.cjs');

program
  .command('extract')
  .option('--staged', '仅提取git暂存区的文件中的词条', false)
  .description('提取词条')
  .action(options => {
    extract({ staged: options.staged });
  });

program
  .command('stats')
  .description('统计词条等数量信息')
  .action(() => {
    stats();
  });

program.option('-v, --version', '显示版本号').action(() => {
  chalkLog('green', version);
});

// 解析命令行参数
program.parse(process.argv);
