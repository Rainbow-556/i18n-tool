// 代码来自webpack的json-loader，https://github.com/webpack-contrib/json-loader/blob/master/index.js
module.exports = function (source) {
  if (this.cacheable) {
    this.cacheable();
  }

  let value = typeof source === 'string' ? JSON.parse(source) : source;
  value = JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  // return `export default ${value}`;
  // 必须以cjs格式导出，axios v0.21.4的该文件axios/lib/helpers/validator.js使用的var pkg = require('./../../package.json');方式请求它的package.json文件，如果是用esm格式导出，在运行时会报错，因为esm导出后的json对象包了一层
  return `module.exports = ${value}`;
};
