const fs = require('fs').promises;
const path = require('path');
const micromatch = require('micromatch');
const { chalkLog } = require('../chalkLog.cjs');

async function traverseFiles({ dirs, include, exclude }, callback) {
  async function traverseDir(dir) {
    try {
      try {
        await fs.access(dir);
      } catch (e) {
        chalkLog('warn', `⚠️ 跳过: 目录不存在或不可访问: ${dir}`, e);
        return;
      }
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          await traverseDir(filePath);
        } else {
          // const relativePath = path.relative(process.cwd(), filePath); // 获取相对于当前工作目录的路径
          const relativePath = filePath;

          // 检查是否在 exclude 中
          if (exclude && exclude.length && micromatch.isMatch(relativePath, exclude)) {
            // 忽略该文件
            continue;
          }

          // 检查是否在 include 中
          if (!(include && include.length) || micromatch.isMatch(relativePath, include)) {
            await callback(path.resolve(relativePath));
          }
        }
      }
    } catch (e) {
      chalkLog('warn', `⚠️ 读取目录失败: ${dir}`, e);
    }
  }

  for (const dir of dirs) {
    await traverseDir(dir);
  }
}

module.exports = { traverseFiles };
