const { regexMatch } = require('./regexMatch.cjs');
// const fs = require('fs');

const checkers = [regexMatch];

function checkTargetString(absolutePath, content) {
  for (let i = 0; i < checkers.length; i++) {
    if (checkers[i].test(absolutePath)) {
      return checkers[i].check(absolutePath, content);
    }
  }
  return [];
}

// const filePath =
//   '/Users/lexin/Desktop/my/work/projects/abroad-middle/i18n-tool/examples/vue2-webpack4/src/assets/scss.scss';
// const results = checkTargetString(filePath, fs.readFileSync(filePath, 'utf-8'));
// console.log(results);

module.exports = {
  checkTargetString
};
