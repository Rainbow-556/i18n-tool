const chalk = require('chalk');

const colorMap = {
  info: 'gray',
  success: 'green',
  warn: 'yellow',
  error: 'red'
};

function chalkLog(level, ...args) {
  const color = colorMap[level];
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
