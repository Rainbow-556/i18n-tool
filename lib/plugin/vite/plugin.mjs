import { shouldProcessFile } from '../../utils/shouldProcessFile.cjs';
import { replaceTargetStringToTCall } from '../../core/replaceTargetStringToTCall.cjs';
import { entryChecker } from '../../core/entryChecker.cjs';
import path from 'path';
import fs from 'fs';

export default function vitePluginI18n() {
  /** serve | build */
  let compileMode;

  return {
    name: 'vite-plugin-i18n-tool',
    // 设置插件只在构建时应用，serve时不应用
    // apply: "build",
    configResolved(config) {
      // todo 要求业务工程手动配置vue插件的comments为false
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
        source: code
      });
      // if (id.endsWith('.cjs') || id.endsWith('.js')) {
      // console.log(`\n-- 产物开始 ${id} --\n`);
      // console.log(transformedCode);
      // console.log(`\n-- 产物结束 ${id} --\n`);
      // }
      return { code: transformedCode };
    },
    handleHotUpdate() {
      // serve时，文件变化时触发，延时检查词条
      setTimeout(() => {
        entryChecker.check(compileMode);
      }, 2000);
    },
    buildEnd() {
      // 构建结束钩子
      // console.log('\n----- 构建结束 entries -----\n');
      // console.log('count:', Object.keys(entries).length);
      // console.log(entries);
      // // todo 测试
      // fs.writeFileSync(path.resolve('entryFromBuild.json'), JSON.stringify(entries, null, 2), 'utf-8');
      entryChecker.check(compileMode);
    }
  };
}
