import { shouldProcessFile } from '../../utils/shouldProcessFile.cjs';
import { replaceTargetStringToTCall } from '../../core/replaceTargetStringToTCall.cjs';
import { entryChecker } from '../../core/entryChecker.cjs';
import { genI18nDirAndFile } from '../../utils/genI18nDirAndFile.cjs';
import path from 'path';
import fs from 'fs';
// import { loadEnv } from 'vite';

// // 获取当前模式（development/production）
// const mode = process.env.NODE_ENV || 'development';

// // 加载环境变量（自动读取.env和.env.[mode]文件）
// const env = loadEnv(mode, process.cwd(), 'VITE_');
// console.log('env2', env);

// 动态生成i18n目录和文件
genI18nDirAndFile();

export default function vitePluginI18n() {
  /** serve | build */
  let compileMode;

  return {
    name: 'vite-plugin-i18n-tool',
    configResolved(config) {
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
      // serve时，文件变化时触发，vite没有一次hmr构建结束结束的钩子，所以延时检查词条
      setTimeout(() => {
        entryChecker.check(compileMode);
      }, 3000);
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
