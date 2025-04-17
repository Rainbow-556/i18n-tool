#!/usr/bin/env node
// 调试 node bin/index.js extract 或者 在业务工程下执行 pnpm link 该包的根目录path

const { program } = require('commander');
const { version } = require('../package.json');
const { extract } = require('../lib/cli/extract.cjs');
const { stats } = require('../lib/cli/stats.cjs');
const { genUncalibratedFile } = require('../lib/cli/genUncalibratedFile.cjs');
const { mergeCalibratedFile } = require('../lib/cli/mergeCalibratedFile.cjs');
const { chalkLog } = require('../lib/utils/chalkLog.cjs');

program.option('-v, --version', '显示版本号').action(() => {
  chalkLog('green', version);
});

program
  .command('extract')
  .description('提取词条')
  .option('--staged', '仅提取git暂存区的文件中的词条', false)
  .action(options => {
    extract({ staged: options.staged });
  });

program
  .command('stats')
  .description('统计词条等数量信息')
  .action(() => {
    stats();
  });

program
  .command('gen-uncalibrated-file')
  .description('生成待校准的语言包文件给翻译人员校准')
  .action(() => {
    genUncalibratedFile();
  });

program
  .command('merge-calibrated-file')
  .description('把已校准的语言包文件合并到项目中')
  .requiredOption('--file <path>', '已校准的语言包文件(必填)')
  .action(options => {
    mergeCalibratedFile({ filePath: options.file });
  });

// 解析命令行参数
program.parse(process.argv);
