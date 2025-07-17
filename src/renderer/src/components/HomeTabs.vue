<template>
  <n-tabs type="line" animated>
    <n-tab-pane name="report" tab="日/周报总结">
      <div>这里是日/周报总结内容</div>
    </n-tab-pane>
    <n-tab-pane name="project" tab="项目管理">
      <ProjectManager />
    </n-tab-pane>
    <n-tab-pane name="oa" tab="OA系统">
      <div>这里是OA系统内容</div>
    </n-tab-pane>
    <n-tab-pane name="settings" tab="基础设置">
      <div>这里是基础设置内容</div>
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'
import ProjectManager from './ProjectManager.vue'
</script> 