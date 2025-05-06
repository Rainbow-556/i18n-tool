const fs = require('fs');
const { Workbook } = require('exceljs');
const { chalkLog } = require('../../utils/chalkLog.cjs');
const { langPack } = require('../../utils/langPack.cjs');

async function merge({ filePath }) {
  chalkLog('info', '开始合并...');
  if (!fs.existsSync(filePath)) {
    chalkLog('error', `文件不存在: ${filePath}`);
    return;
  }

  const calibrated = {};

  const workbookInstance = new Workbook();
  const workbook = await workbookInstance.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const langs = [];
  sheet.eachRow((row, rowNumber) => {
    let key;
    row.eachCell((cell, colNumber) => {
      const cellValue = String(cell.value).trim();
      if (rowNumber === 1 && colNumber >= 2) {
        // 提取语言标识，例如：zh-CN
        langs.push(cellValue.split('_')[0]);
        return;
      }
      if (rowNumber > 1) {
        if (colNumber === 1) {
          // key
          key = cellValue;
        } else {
          // 译文
          const lang = langs[colNumber - 2];
          calibrated[lang] = calibrated[lang] || {};
          calibrated[lang][key] = cellValue;
        }
      }
    });
  });

  // console.log('newCalibrated', calibrated);

  // 校验翻译后的语言包是否有缺失的翻译
  const countInfo = {};
  let firstLangEntryCount;
  let hasMissingTranslation = false;
  Object.keys(calibrated).forEach(lang => {
    const count = Object.keys(calibrated[lang]).length;
    if (firstLangEntryCount === undefined) {
      firstLangEntryCount = count;
    }
    if (!hasMissingTranslation) {
      hasMissingTranslation = count !== firstLangEntryCount;
    }
    countInfo[lang] = count;
  });
  if (hasMissingTranslation) {
    chalkLog('error', `操作失败`);
    chalkLog('error', `有词条未翻译，请检查文件: ${filePath}`);
    chalkLog('error', JSON.stringify(countInfo, null, 2));
    process.exit(1);
  }

  const [langPackInitErr] = langPack.init();
  if (langPackInitErr) {
    chalkLog('error', 'langPack.init()失败', langPackInitErr);
    process.exit(1);
  }

  // 合并写入到语言包文件中
  langPack.mergeCalibrated(calibrated);
  langPack.write({ types: ['calibrated', 'uncalibrated'] });

  chalkLog('info', `合并成功`);
  chalkLog('info', JSON.stringify(countInfo, null, 2));
}

module.exports = {
  merge
};
