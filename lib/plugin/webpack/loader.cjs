const { shouldProcessFile } = require('../../utils/shouldProcessFile.cjs');
const { replaceTargetStringToTCall } = require('../../core/replaceTargetStringToTCall.cjs');

const missingEntries = {};
const zhMap = {};

module.exports = async function (source) {
  // mode: 'development' | 'production'
  const { resourcePath, resourceQuery, mode } = this;
  const webpackVersion = this._compiler?.webpack?.version || this._compiler?.constructor?.version;

  const shouldProcess = shouldProcessFile(resourcePath);
  const isJsonFile = resourcePath.endsWith('.json');
  let newSource = source;
  if (isJsonFile) {
    if (!shouldProcess) {
      if (webpackVersion.startsWith('5.')) {
        // webpack v5该loader设置了type: 'javascript/auto'，需要手动转换json为js
        return `export default ${JSON.stringify(JSON.parse(source))};`;
      }
      return source;
    }
    if (webpackVersion.startsWith('5.')) {
      newSource = `export default ${JSON.stringify(JSON.parse(source))};`;
    }
    // todo webpack v5已测试使用ESM导出通过，v4未测试
    // return `module.exports = ${JSON.stringify(parsedJson)};`;
  }

  if (!shouldProcess) {
    return newSource;
  }

  if (resourcePath.endsWith('.vue') && !/(type=script|type=template)/.test(resourceQuery)) {
    // vue文件只需处理script和template，style块不需要处理
    // todo style块中的中文需要收集起来，提示用户
    return newSource;
  }

  // console.log('\n当前处理文件:', resourcePath, '源码 start\n');
  // console.log('resourceQuery:', resourceQuery, '\n');
  // console.log(newSource);
  // console.log('\n------- 源码 end -------\n');

  const { code } = await replaceTargetStringToTCall({
    filePath: resourcePath,
    source: newSource,
    zhMap,
    missingEntries
  });

  console.log(`\n------- 产物 start ${resourcePath} ------- \n`);
  console.log(code);
  console.log('\n------- 产物 end ------- \n');

  return code;
};

module.exports.getData = () => {
  zhMap, missingEntries;
};
