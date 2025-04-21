import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import vitePluginI18n from '@rainbow556/i18n-tool/lib/vitePluginI18nVue3-2';
import vitePluginI18n from '@rainbow556/i18n-tool/lib/plugin/vite/plugin.mjs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 不保留template中的注释，否则会导致i18n-tool做冗余的词条提取
          comments: false
        }
      }
    }),
    // todo 构建国内时不启用
    vitePluginI18n()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './node_modules/@test')
    }
  }
});
