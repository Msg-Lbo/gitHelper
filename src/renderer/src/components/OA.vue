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
    </template>
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

    <n-tabs type="bar" animated>
      <n-tab-pane name="myProject" tab="我的项目" display-directive="show">

      </n-tab-pane>
      <n-tab-pane name="myProject" tab="我的BUG" display-directive="show">
        
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { NButton, NIcon, NTabs, NTabPane, useMessage } from 'naive-ui'
import { ReloadOutline } from '@vicons/ionicons5'
import { getCompressedOAStyles } from '../styles/oa-injection'

// --- 响应式状态定义 ---

// Webview预加载脚本的本地文件路径
const preloadScriptPath = ref<string | null>(null)
// 对Webview DOM元素的引用
const webviewRef = ref<Electron.WebviewTag | null>(null)
// 用于本地存储的键名
const LOCAL_SETTINGS_KEY = 'githelper-settings'
// 保存从OA系统获取的Token
const oaToken = ref<string | null>(null)
// 消息提示功能
const message = useMessage()
// 防重复消息的时间戳
let lastMessageTime = 0
let lastMessageContent = ''

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
 * 处理登录成功
 */
function handleLoginSuccess(token: string) {
  const currentTime = Date.now()
  const successMsg = '登录成功！'

  // 防止重复消息（1秒内相同内容的消息只显示一次）
  if (currentTime - lastMessageTime < 1000 && lastMessageContent === successMsg) {
    console.log('重复的成功消息，跳过显示:', successMsg)
    return
  }

  lastMessageTime = currentTime
  lastMessageContent = successMsg

  oaToken.value = token
  console.log('显示成功消息:', successMsg)
  message.success(successMsg)

  // 保存Token到本地存储
  try {
    const settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}')
    settings.oaToken = token
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('保存OA Token失败:', e)
  }
}

/**
 * 处理登录失败
 */
function handleLoginFail(errorMsg?: string) {
  const msg = errorMsg || '登录失败，请检查账号密码'
  const currentTime = Date.now()

  // 防止重复消息（1秒内相同内容的消息只显示一次）
  if (currentTime - lastMessageTime < 1000 && lastMessageContent === msg) {
    console.log('重复的错误消息，跳过显示:', msg)
    return
  }

  lastMessageTime = currentTime
  lastMessageContent = msg
  console.log('显示错误消息:', msg)
  message.error(msg)
}

/**
 * 设置IPC消息监听器
 */
function setupIPCListeners(webview: Electron.WebviewTag) {
  // 防止重复添加监听器
  if ((webview as any)._ipcListenerAdded) {
    console.log('IPC 监听器已存在，跳过添加')
    return
  }

  console.log('添加 IPC 消息监听器')
  ;(webview as any)._ipcListenerAdded = true

  webview.addEventListener('ipc-message', (event) => {
    console.log('收到 IPC 消息:', event.channel, event.args)

    if (event.channel === 'login-success') {
      handleLoginSuccess(event.args[0])
    } else if (event.channel === 'login-fail') {
      handleLoginFail(event.args[0])
    }
  })
}

/**
 * 设置页面加载监听器
 */
function setupPageLoadListeners(webview: Electron.WebviewTag) {
  // 防止重复添加监听器
  if ((webview as any)._pageListenerAdded) {
    console.log('页面监听器已存在，跳过添加')
    return
  }

  console.log('添加页面加载监听器')
  ;(webview as any)._pageListenerAdded = true

  // 监听WebView控制台消息（用于调试）
  webview.addEventListener('console-message', (event: any) => {
    console.log('WebView Console:', event.message)
  })

  // 监听页面DOM加载完成事件
  webview.addEventListener('dom-ready', () => {
    console.log('DOM 加载完成，开始注入脚本')

    // 注入CSS样式
    webview.insertCSS(getCompressedOAStyles())

    // 注入登录监听脚本
    injectLoginMonitorScript(webview)

    // 自动填充表单
    autoFillForm(webview)
  })
}

/**
 * 注入登录监听脚本
 */
function injectLoginMonitorScript(webview: Electron.WebviewTag) {
  const loginMonitorScript = `
    // 防止重复注入 - 使用更强的检查机制
    if (window.oaLoginMonitorInjected) {
      console.log('登录监听脚本已存在，跳过注入');
    } else {
      window.oaLoginMonitorInjected = true;
      console.log('开始注入登录监听脚本');

    // 保存原始方法
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // 拦截 fetch 请求
    if (window.fetch) {
      window.fetch = function(...args) {
        const [url, options] = args;
        return originalFetch.apply(this, args).then(res => {
          if (String(url).includes('/api/oa/login')) {
            res.clone().json().then(data => {
              handleLoginResponse(data);
            }).catch(err => {
              console.error('解析登录响应失败:', err);
            });
          }
          return res;
        });
      };
    }

    // 拦截 XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const self = this;
      this.addEventListener('load', function() {
        if (String(self._url).includes('/api/oa/login')) {
          try {
            const responseData = JSON.parse(self.responseText);
            handleLoginResponse(responseData);
          } catch (e) {
            console.error('解析登录响应失败:', e);
          }
        }
      });
      return originalXHRSend.apply(this, arguments);
    };

      // 统一处理登录响应
      function handleLoginResponse(data) {
        console.log('处理登录响应:', data);
        if (data.code === 200 && data.token) {
          console.log('登录成功，发送 login-success 事件');
          window.webviewApi && window.webviewApi.sendToHost('login-success', data.token);
        } else {
          console.log('登录失败，发送 login-fail 事件:', data.msg);
          window.webviewApi && window.webviewApi.sendToHost('login-fail', data.msg || '登录失败');
        }
      }

      console.log('登录监听脚本注入完成');
    }

    null;
  `
  webview.executeJavaScript(loginMonitorScript)
}

/**
 * 自动填充表单
 */
function autoFillForm(webview: Electron.WebviewTag) {
  setTimeout(() => {
    const rawSettings = localStorage.getItem(LOCAL_SETTINGS_KEY)
    if (!rawSettings) return

    try {
      const settings = JSON.parse(rawSettings)
      if (settings.oaAccount && settings.oaPassword) {
        const fillFormScript = `
          // 防止重复注入
          if (window.oaAutoFillInjected) {
            console.log('自动填充脚本已存在，跳过注入');
          } else {
            window.oaAutoFillInjected = true;
            console.log('开始注入自动填充脚本');

          function fillForm() {
            const phoneSelectors = [
              'input[placeholder*="手机"]',
              'input[placeholder*="账号"]',
              'input[placeholder*="用户名"]',
              'input[type="text"]',
              '.el-input__inner[placeholder*="手机"]',
              '.el-input__inner[placeholder*="账号"]'
            ];

            const passwordSelectors = [
              'input[placeholder*="密码"]',
              'input[type="password"]',
              '.el-input__inner[type="password"]'
            ];

            let phoneInput = null;
            let passwordInput = null;

            for (const selector of phoneSelectors) {
              phoneInput = document.querySelector(selector);
              if (phoneInput) break;
            }

            for (const selector of passwordSelectors) {
              passwordInput = document.querySelector(selector);
              if (passwordInput) break;
            }

            if (phoneInput && passwordInput) {
              phoneInput.value = '${settings.oaAccount.replace(/'/g, "\\'")}';
              phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
              phoneInput.dispatchEvent(new Event('change', { bubbles: true }));

              passwordInput.value = '${settings.oaPassword.replace(/'/g, "\\'")}';
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

              return true;
            }
            return false;
          }

            if (!fillForm()) {
              setTimeout(() => {
                if (!fillForm()) {
                  setTimeout(fillForm, 2000);
                }
              }, 1000);
            }

            console.log('自动填充脚本注入完成');
          }

          null;
        `
        webview.executeJavaScript(fillFormScript)
      }
    } catch (e) {
      console.error('自动填充失败:', e)
    }
  }, 500)
}

/**
 * 监听webviewRef的变化。
 * 由于webview是v-if异步渲染的，必须使用watch来确保在DOM元素实际创建后再附加事件监听器。
 */
watch(webviewRef, (webview) => {
  if (webview) {
    // 设置IPC消息监听器
    setupIPCListeners(webview)

    // 设置页面加载监听器
    setupPageLoadListeners(webview)
  }
})

/**
 * 监听webviewRef的变化。
 * 由于webview是v-if异步渲染的，必须使用watch来确保在DOM元素实际创建后再附加事件监听器。
 */
watch(webviewRef, (webview) => {
  if (webview) {
    // 设置IPC消息监听器
    setupIPCListeners(webview)

    // 设置页面加载监听器
    setupPageLoadListeners(webview)
  }
})
</script>

<style scoped lang="scss">
.oa-container {
  width: 100%;
  height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: #18181c;
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
