const { shouldProcessFile } = require('../../utils/shouldProcessFile.cjs');
const { replaceTargetStringToTCall } = require('../../core/replaceTargetStringToTCall.cjs');

module.exports = async function (source) {
  if (this.cacheable) {
    this.cacheable();
  }

  // 只兼容了webpack v4和v5
  // const webpackVersion = this._compiler && this._compiler.webpack && this._compiler.webpack.version || '4.x';
  const { resourcePath, resourceQuery } = this;

  if (!shouldProcessFile(resourcePath)) {
    return source;
  }

  if (resourcePath.endsWith('.vue') && !/(type=script|type=template)/.test(resourceQuery)) {
    // vue文件只需处理script和template，style块不需要处理
    // todo style块中的中文需要收集起来，提示用户需手动改
    return source;
  }

  // if (resourcePath.endsWith('.vue') && resourceQuery.includes('type=template')) {
  //   console.log(`\n------- 源码 start ${resourcePath} ------- \n`);
  //   // console.log('resourceQuery:', resourceQuery, '\n');
  //   console.log(source);
  //   console.log('\n------- 源码 end ------- \n');
  // }

  // if (resourcePath.endsWith('.json')) {
  //   console.log(`\n------- 源码 start ${resourcePath} ------- \n`);
  //   // console.log('resourceQuery:', resourceQuery, '\n');
  //   console.log(source);
  //   console.log('\n------- 源码 end ------- \n');
  // }

  const { code } = await replaceTargetStringToTCall({
    buildTool: 'webpack',
    filePath: resourcePath,
    source
  });

  // console.log(`\n------- 产物 start ${resourcePath} ------- \n`);
  // console.log(code);
  // console.log('\n------- 产物 end ------- \n');

  return code;
};
