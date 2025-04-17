module.exports = function (source) {
  // console.log('\ni18nToolLoader.js is running\n');
  const filePath = this.resourcePath;
  console.log('\n当前处理文件:', filePath, '\n');
  console.log(source);
  console.log('\n------- end -------\n');
  return source;
};
