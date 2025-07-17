<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <div class="window-root">
        <TitleBar />
        <main class="content flex-1">
          <HomeTabs />
        </main>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui'
import TitleBar from './components/TitleBar.vue'
import HomeTabs from './components/HomeTabs.vue'
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
</style>
