import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteI18nPluginVue3 from "./plugins/viteI18nPluginVue3";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          comments: false,
        },
      },
    }),
    viteI18nPluginVue3(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./node_modules/@test"),
    },
  },
});
