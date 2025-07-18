<template>
  <n-tabs @update:value="sendSaveEvent" type="line" default-value="report" animated>
    <n-tab-pane name="report" tab="日/周报总结">
      <keep-alive>
        <SummarizationPanel />
      </keep-alive>
    </n-tab-pane>
    <n-tab-pane name="project" tab="项目管理">
      <keep-alive>
        <ProjectManager />
      </keep-alive>
    </n-tab-pane>
    <n-tab-pane name="oa" tab="OA系统">
      <keep-alive>
        <div>这里是OA系统内容</div>
      </keep-alive>
    </n-tab-pane>
    <n-tab-pane name="settings" tab="基础设置">
      <keep-alive>
        <SettingsPanel @save="sendSaveEvent" />
      </keep-alive>
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'
import ProjectManager from './ProjectManager.vue'
import SettingsPanel from './SettingsPanel.vue'
import SummarizationPanel from './SummarizationPanel.vue'

const emit = defineEmits(['save'])
const sendSaveEvent = () => {
  emit('save')
}
</script> 