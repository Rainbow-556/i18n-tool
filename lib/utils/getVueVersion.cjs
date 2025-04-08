const path = require('path');
const pkgInfo = require(path.resolve('package.json'));

function getVueVersion() {
  const vueVersion = (pkgInfo.dependencies?.vue || pkgInfo.devDependencies?.vue)?.replace(/[^0-9.]/g, '');
  return vueVersion || '';
}

module.exports = { getVueVersion };
