const { program } = require('commander');
const { version } = require('../../package.json');
const { extract } = require('./commands/extract.cjs');
const { stats } = require('./commands/stats.cjs');
const { generate } = require('./commands/generate.cjs');
const { merge } = require('./commands/merge.cjs');
const { chalkLog } = require('../../lib/utils/chalkLog.cjs');

function exec(args) {
  program.option('-v, --version', '显示版本号').action(() => {
    chalkLog('success', version);
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
    .command('generate')
    .description('生成待校准的语言包文件给翻译人员校准')
    .action(() => {
      generate();
    });

  program
    .command('merge')
    .description('把已校准的语言包文件合并到项目中')
    .requiredOption('--file <path>', '已校准的语言包文件(必填)')
    .action(options => {
      merge({ filePath: options.file });
    });
  // 解析命令行参数
  program.parse(args);
}

module.exports = {
  exec
};
