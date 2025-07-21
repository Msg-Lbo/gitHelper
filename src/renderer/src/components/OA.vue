<template>
  <div class="oa-container">
    <!-- 如果没有获取到Token，则显示Webview让用户登录 -->
    <template v-if="!oaToken">
      <webview
        v-if="preloadScriptPath"
        ref="webviewRef"
        src="https://ai.mufengweilai.com/web/oa/manager/login"
        class="oa-webview"
        :preload="preloadScriptPath"
      ></webview>
      <n-button
        v-if="!oaToken"
        class="refresh-button"
        strong
        secondary
        circle
        type="primary"
        @click="reloadWebview"
      >
        <template #icon>
          <n-icon><ReloadOutline /></n-icon>
        </template>
      </n-button>
    </template>

    <!-- 如果成功获取Token，则显示成功信息和Token内容 -->
    <div v-else class="token-display">
      <n-card title="🎉 登录成功" hoverable>
        <p>已成功获取到您的 OA Token，并已保存供其他功能使用。</p>
        <n-blockquote>
          <n-code>{{ oaToken }}</n-code>
        </n-blockquote>
        <template #footer>
          <n-button type="error" ghost @click="logout">退出登录</n-button>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { NButton, NIcon, NCard, NBlockquote, NCode } from 'naive-ui'
import { ReloadOutline } from '@vicons/ionicons5'

// --- 响应式状态定义 ---

// Webview预加载脚本的本地文件路径
const preloadScriptPath = ref<string | null>(null)
// 对Webview DOM元素的引用
const webviewRef = ref<Electron.WebviewTag | null>(null)
// 用于本地存储的键名
const LOCAL_SETTINGS_KEY = 'githelper-settings'
// 保存从OA系统获取的Token
const oaToken = ref<string | null>(null)

// --- 方法定义 ---

/**
 * 重新加载Webview
 */
const reloadWebview = () => {
  const webview = webviewRef.value
  if (webview) {
    webview.reload()
  }
}

/**
 * 执行完整的退出登录流程
 */
const logout = async () => {
  oaToken.value = null
  try {
    // 步骤1: 清除应用本地存储中的Token
    const settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}')
    delete settings.oaToken
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings))

    // 步骤2: 通知主进程清除OA网站在Electron中缓存的会话数据（如Cookie）
    // @ts-ignore
    await window.api.clearOASession()

    // 步骤3: 强制重新渲染Webview，确保得到一个全新的、无会话的实例
    const currentPath = preloadScriptPath.value
    preloadScriptPath.value = null
    await nextTick() // 等待DOM更新
    preloadScriptPath.value = currentPath
  } catch (e) {
    console.error('退出登录失败:', e)
  }
}

// --- 生命周期钩子 ---

/**
 * 组件挂载后执行初始化操作
 */
onMounted(async () => {
  // 优先检查本地是否已缓存Token，避免重复登录
  try {
    const settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}')
    if (settings.oaToken) {
      oaToken.value = settings.oaToken
    }
  } catch (e) {
    console.error('读取本地设置失败:', e)
  }

  // 异步从主进程获取Webview预加载脚本的绝对路径
  try {
    // @ts-ignore
    preloadScriptPath.value = await window.api.getWebviewPreloadPath()
  } catch (error) {
    console.error('获取Webview预加载脚本路径失败:', error)
  }
})

/**
 * 监听webviewRef的变化。
 * 由于webview是v-if异步渲染的，必须使用watch来确保在DOM元素实际创建后再附加事件监听器。
 */
watch(webviewRef, (webview) => {
  if (webview) {
    // 监听从Webview内部通过IPC发送来的消息
    webview.addEventListener('ipc-message', (event) => {
      // 监听到登录成功的消息
      if (event.channel === 'login-success') {
        const receivedToken = event.args[0]
        oaToken.value = receivedToken // 更新UI状态，显示成功界面
        // 将Token保存到本地存储
        try {
          const settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}')
          settings.oaToken = receivedToken
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings))
        } catch (e) {
          console.error('保存OA Token失败:', e)
        }
      }
    })

    // 监听Webview内部页面DOM加载完成的事件
    webview.addEventListener('dom-ready', () => {
      // 定义并注入自定义CSS，美化登录页外观
      const cssToInject = `
        /* 此处省略大量CSS样式代码... */
        html, body { background: transparent !important; }
        .login .left { display: none !important; }
      `
      webview.insertCSS(cssToInject.replace(/\s+/g, ' ')) // 压缩并注入

      // 定义并注入JS脚本，用于拦截页面内的网络请求
      const jsToInject = `
        // 拦截现代浏览器使用的fetch API
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            const [url] = args;
            return originalFetch.apply(this, args).then(res => {
              if (String(url).includes('/api/oa/login') && res.status === 200) {
                res.clone().json().then(data => {
                  if (data.code === 200 && data.token) {
                    window.webviewApi.sendToHost('login-success', data.token);
                  }
                });
              }
              return res;
            });
          };
        }
        // 拦截传统的XMLHttpRequest API
        if (window.XMLHttpRequest) {
          const originalXhrOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url;
            return originalXhrOpen.apply(this, arguments);
          };
          const originalXhrSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', function() {
              if (String(this._url).includes('/api/oa/login') && this.status === 200) {
                try {
                  const data = JSON.parse(this.responseText);
                  if (data.code === 200 && data.token) {
                    window.webviewApi.sendToHost('login-success', data.token);
                  }
                } catch (e) {}
              }
            });
            return originalXhrSend.apply(this, arguments);
          };
        }
        null; // 确保脚本执行后返回一个可序列化的值
      `
      webview.executeJavaScript(jsToInject)

      // 定义并注入JS脚本，用于自动填充表单
      const rawSettings = localStorage.getItem(LOCAL_SETTINGS_KEY)
      if (!rawSettings) return
      try {
        const settings = JSON.parse(rawSettings)
        if (settings.oaAccount && settings.oaPassword) {
          const fillFormJs = `
            document.querySelector('input[placeholder*="账号"]').value = '${settings.oaAccount.replace(/'/g, "\\'")}';
            document.querySelector('input[placeholder*="密码"]').value = '${settings.oaPassword.replace(/'/g, "\\'")}';
            null;
          `
          webview.executeJavaScript(fillFormJs)
        }
      } catch (e) {}
    })
  }
})
</script>

<style scoped lang="scss">
.oa-container {
  width: 100vw;
  height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.oa-webview {
  width: 100%;
  height: 100%;
  border: none;
}

.token-display {
  padding: 40px;
  max-width: 600px;
  width: 100%;
}

.refresh-button {
  position: fixed;
  right: 40px;
  bottom: 80px;
}
</style>
