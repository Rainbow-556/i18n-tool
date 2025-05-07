import { shouldProcessFile } from '../../utils/file/shouldProcessFile.cjs';
import { replaceTargetStringToTCall } from '../../core/replaceTargetStringToTCall.cjs';
import { entryChecker } from '../../core/entry/entryChecker.cjs';
import { genI18nRuntimeCode } from '../../utils/file/genI18nRuntimeCode.cjs';
import { chalkLog } from '../../utils/chalkLog.cjs';
import { i18nToolConfig } from '../../utils/i18nToolConfig.cjs';

export default function vitePluginI18n() {
  /** serve | build */
  let compileMode;

  // 生成i18n运行时代码
  genI18nRuntimeCode();
  chalkLog('info', `本次运行时支持的语言为: ${i18nToolConfig.runtimeTargetLangs.join(',')}\n`);

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
      entryChecker.check(compileMode);
    }
  };
}
