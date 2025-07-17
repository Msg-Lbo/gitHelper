<template>
  <header class="title-bar flex align-center justify-between">
    <section class="left flex align-center gap-10">
      <img src="../assets/icon.png" class="logo" />
      <span class="title">Git Helper</span>
    </section>
    <nav class="right flex align-center gap-10" style="-webkit-app-region: no-drag">
      <n-button quaternary circle @click="minimizeWindow" class="bar-btn">
        <template #icon>
          <n-icon>
            <RemoveOutline />
          </n-icon>
        </template>
      </n-button>
      <n-button quaternary circle @click="closeWindow" class="bar-btn close">
        <template #icon>
          <n-icon>
            <Close />
          </n-icon>
        </template>
      </n-button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { Close, RemoveOutline } from '@vicons/ionicons5'

const minimizeWindow = () => {
  window.api?.minimize()
}
const closeWindow = () => {
  window.api?.close()
}
</script>

<style scoped lang="scss">
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
</style> 