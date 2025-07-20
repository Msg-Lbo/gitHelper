<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider placement="top-right" container-style="top: 50px;">
      <div class="window-root">
        <TitleBar />
        <main class="content flex-1">
          <HomeTabs @save="handleCheckDeepSeekBalance" />
        </main>
        <footer class="footer flex justify-between align-center">
          <div class="app-version flex align-center gap-5">
            <div
              class="status-dot"
              :style="{ background: balanceInfo?.is_available ? '#4caf50' : '#e9546b' }"
            ></div>
            <span class="app-version-text">Git Helper v{{ appVersion }}</span>
          </div>
          <div class="balance-info">
            <span class="balance-info-text">
              <span class="balance-info-text-value">
                ￥{{ balanceInfo?.balance_infos[0]?.total_balance || 0 }}
              </span>
            </span>
          </div>
        </footer>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NMessageProvider, createDiscreteApi } from 'naive-ui'
import TitleBar from './components/TitleBar.vue'
import HomeTabs from './components/HomeTabs.vue'
import { checkDeepSeekBalance } from './api/deepseek'
import { onMounted, ref } from 'vue'

interface BalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

interface DeepSeekBalance {
  is_available: boolean
  balance_infos: BalanceInfo[]
}

const balanceInfo = ref<DeepSeekBalance>()
const appVersion = ref('') // 应用版本号，可以从package.json中获取
const { message } = createDiscreteApi(['message'], {
  configProviderProps: {
    theme: darkTheme
  },
  messageProviderProps: {
    placement: 'top-right',
    containerStyle: 'top: 50px'
  }
})
const deepseekToken = ref<string>('')

// 获取配置
const getSettings = () => {
  const raw = localStorage.getItem('githelper-settings')
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {}
  }
  return {}
}

const handleCheckDeepSeekBalance = async () => {
  try {
    const settings = getSettings()
    deepseekToken.value = settings.token || ''
    const res: DeepSeekBalance = await checkDeepSeekBalance(deepseekToken.value)
    if (res) {
      if (res.is_available) {
        balanceInfo.value = res
      } else {
        message.error('当前账户余额不足，请充值')
      }
    }
  } catch (error) {
    message.error('token 无效，请重新配置')
    balanceInfo.value = {
      is_available: false,
      balance_infos: []
    }
  }
}

onMounted(async () => {
  if (deepseekToken.value) {
    handleCheckDeepSeekBalance()
  }
  // 获取应用实际版本号
  appVersion.value = await window.api.getAppVersion()
})
</script>

<style scoped lang="scss">
.window-root {
  width: 800px;
  height: 600px;
  background: #18181c;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);

  .title-bar {
    height: 40px;
    background: #23232b;
    padding: 0 16px;
    -webkit-app-region: drag;
    user-select: none;
  }

  .left {
    .logo {
      width: 32px;
      height: 32px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  .right {
    .bar-btn {
      width: 32px;
      height: 32px;
      color: #fff;
    }

    .bar-btn.close:hover {
      background: #e9546b;
      color: #fff;
    }
  }
}

.content {
  padding: 0 10px;
  background: #18181c;
  overflow: auto;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 5px 10px;
  background: #23232b;
  .app-version {
    font-size: 13px;
    color: #aaa;
    z-index: 10;
    cursor: pointer;

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #aaa;
      box-shadow: 0 0 2px #0002;
      transition: background 0.5s ease-in-out;
    }
  }

  .balance-info {
    .balance-info-text {
      font-size: 13px;
      color: #aaa;
    }
  }
}
</style>
