const { langPack } = require('../../utils/langPack.cjs');
const { chalkLog } = require('../../utils/chalkLog.cjs');

const entryChecker = {
  entries: {},
  missingTranslationEntries: {},
  collectMissingEntry({ key, content }) {
    const [langPackInitErr] = langPack.init();
    if (langPackInitErr) {
      chalkLog('error', 'langPack.init()失败', langPackInitErr);
      process.exit(1);
    }

    // 找出src/i18n/(uncalibrated|calibrated)/(zh-CN|en-US...).json中不存在的词条
    const missingLangs = langPack.checkMissingLangs(key);
    if (missingLangs.length > 0) {
      if (!this.missingTranslationEntries[key]) {
        this.missingTranslationEntries[key] = {
          content,
          missingLangs
        };
      }
      return true;
    }

    this.entries[key] = content;
    return false;
  },
  /**
   * @param {string} buildMode 'build' | 'serve'
   */
  check(buildMode) {
    if (Object.keys(this.missingTranslationEntries).length > 0) {
      if (buildMode === 'serve') {
        chalkLog('info', `\n以下增量词条将会在 git pre-commit 中自动提取`);
        chalkLog('info', JSON.stringify(this.missingTranslationEntries, null, 2));
      } else if (buildMode === 'build') {
        chalkLog('error', `\n以下词条未提取，构建失败，请执行 i18n-tool extract 命令完成提取后再构建`);
        chalkLog('error', JSON.stringify(this.missingTranslationEntries, null, 2));
        // 中断构建
        process.exit(1);
      }
    }
  }
};

module.exports = { entryChecker };
