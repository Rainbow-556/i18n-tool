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
