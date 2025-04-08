const fs = require('fs');
const path = require('path');
const { Biome, Distribution } = require('@biomejs/js-api');

const codeFormatter = {
  biome: null,
  async init() {
    if (this.biome) {
      return;
    }
    this.biome = await Biome.create({
      distribution: Distribution.NODE // Or BUNDLER / WEB depending on the distribution package you've installed
    });
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

module.exports = {
  codeFormatter
};

async function test() {
  const filePath = path.join(__dirname, 'stringTestCase.js');
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  await formatter.init();
  const result = formatter.format(sourceCode);
  console.log('\nresult\n');
  console.log(result);
  // 将修复后的代码写回文件
  // const newFilePath = path.join(
  //   path.dirname(filePath),
  //   path.basename(filePath, path.extname(filePath)) + '2' + path.extname(filePath)
  // );
  // fs.writeFileSync(newFilePath, result, 'utf8');
}

// test();
