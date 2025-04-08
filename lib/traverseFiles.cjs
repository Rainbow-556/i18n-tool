const fs = require('fs').promises;
const path = require('path');
const micromatch = require('micromatch');

async function traverseFiles({ dirs, include, exclude }, callback) {
  const includePathList = [];
  const excludePathList = [];
  async function traverseDir(dir) {
    try {
      try {
        await fs.access(dir); // Check if directory exists
      } catch (err) {
        console.log(`Directory ${dir} does not exist or is not accessible`);
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
          if (exclude?.length && micromatch.isMatch(relativePath, exclude)) {
            // 忽略该文件
            excludePathList.push(relativePath);
            // 拼成绝对路径
            // excludePathList.push(path.resolve(relativePath));
            continue;
          }

          // 检查是否在 include 中
          if (!include?.length || micromatch.isMatch(relativePath, include)) {
            includePathList.push(relativePath);
            await callback(path.resolve(relativePath));
          }
        }
      }
    } catch (err) {
      console.log(`Error reading directory ${dir}:`, err);
    }
  }

  for (const dir of dirs) {
    await traverseDir(dir);
  }
  console.log('\nincludePathList\n');
  console.log(includePathList);
  console.log('\nexcludePathList\n');
  console.log(excludePathList);
}

// 示例用法
// const dirsToScan = ['src', 'node_modules/@a/b', 'node_modules/@rainbow556/i18n-tool/lib'];
const dirsToScan = ['src'];
// const includePatterns = ['**/*.js', '**/*.vue', '**/*.json']; // 例如，包含所有的 .js 和 .jsx 文件
const includePatterns = ['**/*.{js,json,vue}']; // 例如，包含所有的 .js 和 .jsx 文件
// const includePatterns = []; // 例如，包含所有的 .js 和 .jsx 文件
// 默认设置 ['node_modules/**']
// const excludePatterns = ['src/components/**', '**/{package,package-lock}.json']; // 例如，排除测试文件夹和 dist 文件夹
const excludePatterns = ['node_modules/**'];

// traverseFiles({
//   dirs: dirsToScan,
//   include: includePatterns,
//   exclude: excludePatterns
// });

module.exports = {
  traverseFiles
};
