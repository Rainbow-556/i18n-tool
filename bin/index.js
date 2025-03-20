#!/usr/bin/env node
// 调试 node bin/index.js extract

import { program } from 'commander';
// import packageInfo from '../package.json' assert { type: 'json' };
import { extract } from '../lib/cli/extract.js';

// 添加 extract 命令
program
  .command('extract')
  .description('提取翻译文本')
  .action(() => {
    extract();
  });

// 解析命令行参数
program.parse(process.argv);
