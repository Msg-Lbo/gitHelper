import './assets/style/style.scss'
import { createApp } from 'vue'
import App from './App.vue'
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
