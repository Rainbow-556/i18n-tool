const chalk = require('chalk');

const colorMap = {
  info: 'gray',
  success: 'green',
  warn: 'yellow',
  error: 'red',
  process: 'cyan',
  data: 'blueBright',
  debug: 'magenta'
};

function chalkLog(level, ...args) {
  const colorConfig = colorMap[level];
  if (!colorConfig) {
    console.log(...args);
    return;
  }

  let coloredText = chalk;
  if (Array.isArray(colorConfig)) {
    colorConfig.forEach(style => {
      coloredText = coloredText[style];
    });
  } else {
    coloredText = coloredText[colorConfig];
  }

  console.log(coloredText(...args));
}

module.exports = {
  chalkLog
};
