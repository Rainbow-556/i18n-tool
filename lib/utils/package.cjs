const path = require('path');
const pkgInfo = require(path.resolve('package.json'));

function getVueVersion() {
  const vueVersion = (pkgInfo.dependencies?.vue || pkgInfo.devDependencies?.vue)?.replace(/[^0-9.]/g, '');
  return vueVersion || '';
}

function getUIFramework() {
  if (pkgInfo.dependencies?.vue || pkgInfo.devDependencies?.vue) {
    return 'vue';
  }
  if (pkgInfo.dependencies?.react || pkgInfo.devDependencies?.react) {
    return 'react';
  }
  return 'unknown';
}

module.exports = { getVueVersion, getUIFramework };
