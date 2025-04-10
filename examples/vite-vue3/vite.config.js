import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import vitePluginI18nVue3 from '@rainbow556/i18n-tool/lib/vitePluginI18nVue3';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          comments: false
        }
      }
    })
    // vitePluginI18nVue3()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './node_modules/@test')
    }
  }
});
