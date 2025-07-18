import './assets/style/style.scss'
import { createApp } from 'vue'
import App from './App.vue'

// 添加错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
})

try {
  const app = createApp(App)
  app.config.errorHandler = (err, _vm, info) => {
    console.error('Vue错误:', err, info)
  }
  app.mount('#app')
  console.log('Vue应用已成功挂载')
} catch (error) {
  console.error('应用启动失败:', error)
}
