<template>
  <div class="oa-container">
    <webview
      src="https://ai.mufengweilai.com/web/oa/manager/login"
      class="oa-webview"
    ></webview>
  </div>
</template>

<script setup lang="ts"></script>

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
</style>
