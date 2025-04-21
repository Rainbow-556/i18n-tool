import { shouldProcessFile } from '../../utils/shouldProcessFile.cjs';
import { chalkLog } from '../../utils/chalkLog.cjs';
import { replaceTargetStringToTCall } from '../../core/replaceTargetStringToTCall.cjs';
import path from 'path';
import fs from 'fs';

export default function vitePluginI18n() {
  const zhMap = {};
  /** serve | build */
  let compileMode;
  const missingEntries = {};

  return {
    name: 'vite-plugin-i18n-tool',
    // 设置插件只在构建时应用，serve时不应用
    // apply: "build",
    configResolved(config) {
      // todo 修改vue插件的comments为false
      compileMode = config.command;
    },
    async transform(code, id) {
      // 过滤不需要处理的文件
      if (!shouldProcessFile(id)) {
        return { code };
      }

      // 在transform钩子中的入参code都已经是js代码
      // if (id.endsWith('.cjs') || id.endsWith('.js')) {
      //   console.log(`\n----- 源代码文件-开始: ${id} -----\n`);
      //   console.log(code);
      //   console.log(`\n----- 源代码文件-结束: ${id} -----\n`);
      // }

      const { code: transformedCode } = await replaceTargetStringToTCall({
        buildTool: 'vite',
        filePath: id,
        source: code,
        zhMap,
        missingEntries
      });
      // if (id.endsWith('.cjs') || id.endsWith('.js')) {
      // console.log(`\n-- 产物开始 ${id} --\n`);
      // console.log(transformedCode);
      // console.log(`\n-- 产物结束 ${id} --\n`);
      // }
      return { code: transformedCode };
    },
    buildEnd() {
      // 构建结束钩子
      // todo 构建结束后，webpack和vite统一提示未提取的词条
      console.log('\n----- 构建结束 zhMap -----\n');
      console.log('count:', Object.keys(zhMap).length);
      console.log(zhMap);
      // todo 测试
      fs.writeFileSync(path.resolve('entryFromBuild.json'), JSON.stringify(zhMap, null, 2), 'utf-8');

      if (Object.keys(missingEntries).length > 0) {
        if (compileMode === 'serve') {
          // todo 需要找到本次构建结束的钩子中打印以下信息，否则无法打印，serve时一直未构建结束
          chalkLog('gray', `以下词条未提取，将会在 git pre-commit 中自动提取`);
          chalkLog('gray', JSON.stringify(missingEntries, null, 2));
        } else if (compileMode === 'build') {
          chalkLog('red', `构建失败，以下词条未提取，请执行 npx i18n-tool extract 命令`);
          chalkLog('red', JSON.stringify(missingEntries, null, 2));
          process.exit(1);
        }
      }
    }
  };
}
