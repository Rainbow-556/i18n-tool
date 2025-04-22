// 代码来自webpack的json-loader，https://github.com/webpack-contrib/json-loader/blob/master/index.js
module.exports = function (source) {
  if (this.cacheable) {
    this.cacheable();
  }

  let value = typeof source === 'string' ? JSON.parse(source) : source;
  value = JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `export default ${value}`;
};
