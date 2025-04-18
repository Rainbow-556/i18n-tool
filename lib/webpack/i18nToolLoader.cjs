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

module.exports = function (source) {
  // console.log('\ni18nToolLoader.js is running\n');
  const { resourcePath, resourceQuery } = this;
  if (resourcePath.endsWith('.vue') && /(type=script|type=template)/.test(resourceQuery)) {
    console.log('\n当前处理文件:', resourcePath, '\n');
    console.log('resourceQuery:', resourceQuery, '\n');
    console.log(source);
    console.log('\n------- end -------\n');
  }

  return source;
};
