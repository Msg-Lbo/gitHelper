<template>
  <div class="oa-container">
    <webview
      ref="webviewRef"
      src="https://ai.mufengweilai.com/web/oa/manager/login"
      class="oa-webview"
    ></webview>
    <n-button class="refresh-button" strong secondary circle type="primary" @click="reloadWebview">
      <template #icon>
        <n-icon><ReloadOutline /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { ReloadOutline } from '@vicons/ionicons5'

const webviewRef = ref<Electron.WebviewTag | null>(null)
const LOCAL_SETTINGS_KEY = 'githelper-settings'

const reloadWebview = () => {
  const webview = webviewRef.value
  if (webview) {
    webview.reload()
  }
}

onMounted(() => {
  const webview = webviewRef.value
  if (webview) {
    webview.addEventListener('dom-ready', () => {
      const cssToInject = `
        html, body {
          background: transparent !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }

        body {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          height: 85vh !important;
          margin: 0 !important;
          overflow: hidden !important;
        }

        body > *:not(#app) { display: none !important; }
        .login .left { display: none !important; }
        .right .title { display: none !important; }
        .loginFooter { display: none !important; }

        /* 4. Reset container styles to ensure proper centering */
        #app, .login, .loginContent, .signWrap {
          all: unset !important;
          display: block !important;
        }

        .right {
          max-width: 480px !important;
          width: 100% !important;
          padding: 20px !important;
          box-sizing: border-box !important;
          border-radius: 8px;
          background-color: rgba(40, 40, 44, 0.8) !important;
          backdrop-filter: blur(10px);
          all: unset; /* Important: Reset .right itself before styling */
          display: block; /* Re-apply display after reset */
        }
        .right .el-input__inner {
          background-color: rgb(42, 42, 46) !important;
          border: 1px solid rgb(51, 54, 57) !important;
          color: rgb(232, 232, 232) !important;
          box-shadow: none !important;
          height: 40px !important;
          line-height: 40px !important;
        }
        .right .el-input__inner::placeholder {
          color: rgba(194, 194, 194, 0.4) !important;
        }
        .right .el-input__inner:focus {
          border-color: #7FE7C4 !important;
        }
        .right .el-button--primary {
          width: 100% !important;
          background-color: #7FE7C4 !important;
          border-color: #7FE7C4 !important;
          height: 45px !important;
        }
        .right .el-button--primary:hover {
          background-color: #7FE7C4 !important;
          border-color: #7FE7C4 !important;
        }
        .right .el-form-item {
          margin-bottom: 24px !important;
        }
        .right .el-input-group__append {
          background: transparent !important;
          border: none !important;
        }
        .right .code {
          height: 40px !important;
          line-height: 40px !important;
        }

      `
      webview.insertCSS(cssToInject)

      // 开始自动填充
      const rawSettings = localStorage.getItem(LOCAL_SETTINGS_KEY)
      if (!rawSettings) return

      try {
        const settings = JSON.parse(rawSettings)
        const { oaAccount, oaPassword } = settings

        if (oaAccount && oaPassword) {
          // 转义单引号
          const escapedAccount = oaAccount.replace(/'/g, "\\'")
          const escapedPassword = oaPassword.replace(/'/g, "\\'")

          const fillFormJs = `
            const accountInput = document.querySelector('input[placeholder*="手机号"], input[placeholder*="账号"]');
            const passwordInput = document.querySelector('input[placeholder*="密码"]');

            if (accountInput) {
              accountInput.value = '${escapedAccount}';
              accountInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (passwordInput) {
              passwordInput.value = '${escapedPassword}';
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          `
          webview.executeJavaScript(fillFormJs.trim())
        }
      } catch (e) {
        console.error('Failed to parse settings for OA autofill:', e)
      }
      // 结束自动填充
    })
  }
})
</script>

<style scoped lang="scss">
.oa-container {
  width: 100vw;
  height: calc(100vh - 70px);
  display: flex;
}

.oa-webview {
  flex: 1;
  border: none;
}

.refresh-button {
  position: fixed;
  right: 40px;
  bottom: 80px;
}
</style>
