const chalk = require('chalk');

function chalkLog(color, ...args) {
  if (chalk[color]) {
    const coloredText = chalk[color](...args);
    console.log(coloredText);
  } else {
    console.log(...args);
  }
}

module.exports = {
  chalkLog
};
