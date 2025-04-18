const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');
const { codeFormatter } = require('../utils/codeFormatter.cjs');
const { containsChinese } = require('../utils/containsChinese.cjs');
const { generateKey } = require('../utils/generateKey.cjs');
const { shouldProcessFile } = require('../utils/shouldProcessFile.cjs');
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { langPack } = require('../utils/langPack.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');
const path = require('path');
const fs = require('fs');

const missingEntry = {};

module.exports = function (source) {
  // todo .cjs文件导入@/i18n/index使用require
  // mode: 'development' | 'production'
  const { resourcePath, resourceQuery, mode } = this;

  if (resourcePath.endsWith('.json')) {
    const parsedJson = JSON.parse(source);
    // todo webpack v5已测试使用ESM导出通过，v4未测试
    // return `module.exports = ${JSON.stringify(parsedJson)};`;
    return `
    import { a } from '@/fileFormat/js.js';
    console.log('动态在.json中添加的', a);

    export default ${JSON.stringify(parsedJson)};`;
  }

  if (!shouldProcessFile(resourcePath) || !resourcePath.endsWith('.cjs')) {
    return source;
  }

  console.log('\n当前处理文件:', resourcePath, '\n');
  console.log('resourceQuery:', resourceQuery, '\n');
  console.log(source);
  console.log('\n------- end -------\n');

  if (resourcePath.endsWith('.vue') && /(type=script|type=template)/.test(resourceQuery)) {
    missingEntry[resourceQuery] = '';
  }

  return source;
};

module.exports.getMissingEntry = () => missingEntry;
