const { Biome, Distribution } = require('@biomejs/js-api');

/** 用于把js中使用 + 号拼接的字符串格式化成模板字符串的形式 */
const codeFormatter = {
  biome: null,
  async init() {
    if (this.biome) {
      return [null];
    }
    try {
      this.biome = await Biome.create({ distribution: Distribution.NODE });
      this.biome.applyConfiguration({
        javascript: {
          formatter: {
            enabled: true,
            quoteStyle: 'double',
            semicolons: 'always'
          }
        },
        formatter: {
          enabled: true,
          indentStyle: 'space',
          indentWidth: 2,
          lineWidth: 120,
          lineEnding: 'lf'
        },
        linter: {
          enabled: true,
          rules: {
            recommended: false,
            complexity: {
              all: false,
              noUselessStringConcat: { level: 'warn', fix: 'safe', options: null }
            },
            style: {
              all: false,
              useTemplate: { level: 'warn', fix: 'safe', options: null }
            }
          }
        }
      });
      return [null];
    } catch (e) {
      return [e];
    }
  },
  format(code) {
    const { content: formattedCode } = this.biome.formatContent(code, {
      // 文件路径用于类型推断
      filePath: 'temp.js'
    });

    const { content: lintedCode } = this.biome.lintContent(formattedCode, {
      // 文件路径用于类型推断
      filePath: 'temp.js',
      fixFileMode: 'SafeFixes'
    });
    return lintedCode;
  }
  // destroy() {
  //   this.biome.shutdown();
  // }
};

module.exports = { codeFormatter };
