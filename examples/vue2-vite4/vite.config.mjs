import { defineConfig } from 'vite';
// import { createVuePlugin } from 'vite-plugin-vue2';
import vue from '@vitejs/plugin-vue2';
import vueJsx from '@vitejs/plugin-vue2-jsx';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';
import vitePluginI18n from '@rainbow556/i18n-tool/lib/plugin/vite/plugin.mjs';

// console.log('run');

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    createHtmlPlugin({
      pages: [
        {
          entry: 'src/pageA/main.js',
          filename: 'pageA.html',
          // template: 'src/pageA/pageA.html',
          template: 'pageA.html',
          injectOptions: {
            data: {
              title: 'pageA'
            }
          }
        },
        {
          entry: 'src/pageB/main.js',
          filename: 'pageB.html',
          // template: 'src/pageB/pageB.html',
          template: 'pageB.html',
          injectOptions: {
            data: {
              title: 'pageB'
            }
          }
        }
      ]
    }),
    vitePluginI18n()
    // multiPageRoutePlugin2()
    // customBuildPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // root: '.',
  build: {
    rollupOptions: {
      input: {
        pageA: path.resolve(__dirname, 'pageA.html'),
        pageB: path.resolve(__dirname, 'pageB.html')
        // pageA: path.resolve(__dirname, 'src/pageA/pageA.html'),
        // pageB: path.resolve(__dirname, 'src/pageB/pageB.html')
      },
      output: {
        // Group files by type
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  server: {
    // 解决dev模式下vite的dev server允许响应正式域名的请求
    allowedHosts: true,
    port: 5175
  }
});

// 自定义构建输出插件
function customBuildPlugin() {
  return {
    name: 'custom-build',
    generateBundle(options, bundle) {
      // 遍历所有生成的文件
      Object.keys(bundle).forEach(fileName => {
        console.log('fileName', fileName);
        const file = bundle[fileName];

        // 只处理 HTML 文件
        if (fileName.includes('/') && fileName.endsWith('.html')) {
          // 重命名文件
          const newName = fileName.split('/').pop();
          bundle[newName] = file;
          delete bundle[fileName];
        }
      });
    }
  };
}

function multiPageRoutePlugin2() {
  return {
    name: 'multi-page-route',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        console.log('Middleware called:', req.url);

        const url = req.url.split('?')[0]; // 移除查询参数
        // 路由映射
        const routes = {
          '/pageA': '/src/pageA/pageA.html',
          '/pageB': '/src/pageB/pageB.html'
        };
        if (routes[url]) {
          console.log('Rewriting:', req.url, '->', routes[url]);
          req.url = routes[url];
        }

        next();
      });
    }
  };
}

// 创建路由重写插件
function multiPageRoutePlugin() {
  return {
    name: 'multi-page-route',
    configureServer(server) {
      console.log('configureServer called');

      server.middlewares.use((req, res, next) => {
        console.log('Middleware called:', req.url);

        const url = req.url.split('?')[0];

        // 路由映射
        const routes = {
          '/pageA': '/src/pageA/pageA.html',
          '/pageB': '/src/pageB/pageB.html'
        };

        // 只重写页面路由，不处理静态资源
        if (routes[url] && !url.includes('.') && !url.startsWith('/src/') && !url.startsWith('/@')) {
          console.log('Rewriting:', req.url, '->', routes[url]);
          req.url = routes[url];
        }

        next();
      });
    }
  };
}
