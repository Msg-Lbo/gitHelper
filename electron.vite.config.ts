import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          webviewPreload: resolve(__dirname, 'src/preload/webviewPreload.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // 将 webview 标签视为自定义元素
            isCustomElement: (tag) => tag === 'webview'
          }
        }
      })
    ],
    build: {
      // 添加这些选项来解决crypto.hash问题
      rollupOptions: {
        onwarn(warning, warn) {
          // 忽略某些警告
          if (warning.code === 'EVAL') return
          warn(warning)
        }
      }
    },
    // 添加这些选项来解决Node.js API问题
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    }
  }
})
