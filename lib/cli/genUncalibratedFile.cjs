const path = require('path');
const fs = require('fs');
const { Workbook } = require('exceljs');
const { i18nToolConfig } = require('../utils/i18nToolConfig.cjs');
const { chalkLog } = require('../utils/chalkLog.cjs');
const { langPack } = require('../utils/langPack.cjs');

async function genUncalibratedFile() {
  chalkLog('info', '开始生成...');
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('语言包');

  langPack.init();

  const langs = Object.keys(langPack.uncalibrated).filter(lang => lang !== i18nToolConfig.originLang);
  // 把originLang放到最前面
  langs.unshift(i18nToolConfig.originLang);

  const grayStyle = {
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    }
  };
  const langColumns = langs.map(lang => {
    return {
      header: lang === i18nToolConfig.originLang ? `${lang}_(请勿修改该列的值)` : lang,
      key: lang,
      style: lang === i18nToolConfig.originLang ? grayStyle : undefined
    };
  });
  worksheet.columns = [
    // 第一列为key
    {
      header: 'key_(请勿修改该列的值)',
      key: 'key',
      width: 40,
      style: grayStyle
    },
    // 其他列为语言
    ...langColumns
  ];

  // 收集待校准语言包的所有key
  const allKeys = new Set();
  langs.forEach(lang => {
    const keys = Object.keys(langPack.uncalibrated[lang]);
    keys.forEach(key => allKeys.add(key));
  });
  const data = [...allKeys].map(key => {
    const row = { key };
    langs.forEach(lang => {
      // 如果待校准语言包中没有该key，则从已校准语言包中获取，如果已校准语言包中也没有该key，则报错
      const content = langPack.uncalibrated[lang][key] || langPack.calibrated[lang][key];
      if (!content) {
        chalkLog('error', `操作失败`);
        chalkLog('error', `语言包 ${lang} 中缺少key为 ${key} 的词条，请重新执行 i18n-tool extract 命令`);
        process.exit(1);
      }

      row[lang] = content;
    });
    return row;
  });
  worksheet.addRows(data);

  worksheet.columns.forEach(column => {
    let maxColumnLength = 0;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber === 1) {
        // 设置第一行表头样式
        cell.style = {
          font: {
            bold: true,
            size: 14,
            color: {
              argb: 'FFFFFFFF'
            }
          },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF409EFF' }
          }
        };
      }
      if (column.number > 1) {
        // 计算单元格内容的长度
        const cellValue = cell.value;
        const valueLength = cellValue ? String(cellValue).length : 0;
        maxColumnLength = Math.max(maxColumnLength, valueLength);
      }
    });
    if (column.number > 1) {
      // 设置列宽为最长内容的长度的两倍，让其尽量完全展示
      column.width = maxColumnLength * 2;
    }
  });

  // 冻结
  worksheet.views = [
    {
      state: 'frozen',
      // 冻结前2列
      xSplit: 2,
      // 冻结第1行
      ySplit: 1,
      showGridLines: true
    }
  ];

  const tempDir = path.resolve(i18nToolConfig.tempDir);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const time = formatDateToYYYYMMDDHHMMSS(new Date());
  const uncalibratedFilePath = path.resolve(i18nToolConfig.tempDir, `待校准-${time}.xlsx`);
  await workbook.xlsx.writeFile(uncalibratedFilePath);
  chalkLog('info', `生成成功，文件路径: ${uncalibratedFilePath}`);
}

function formatDateToYYYYMMDDHHMMSS(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

module.exports = {
  genUncalibratedFile
};
