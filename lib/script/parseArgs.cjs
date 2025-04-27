/** 把 --a a --b 格式的参数解析成 { a: 'a', b: true } 形式 */
function parseArgs() {
  // 去掉前两个默认参数
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // 检查下一个参数是否是值（不是以--开头）
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1];
        // 跳过下一个参数
        i++;
      } else {
        // 没有值则设为true
        result[key] = true;
      }
    }
  }
  return result;
}

module.exports = {
  parseArgs
};
