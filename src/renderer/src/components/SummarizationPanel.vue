<template>
  <div class="summarization-panel">
    <section class="header">
      <n-space justify="start" align="center">
        <n-button type="info" size="small" @click="openProjectModal('daily')"
          >总结正常日报</n-button
        >
        <n-button type="info" size="small" @click="openProjectModal('overtime')"
          >总结加班日报</n-button
        >
        <n-button type="info" size="small" @click="openProjectModal('weekly')">总结周报</n-button>
      </n-space>
    </section>
    <section class="content">
      <n-card size="small" :bordered="false" hoverable content-style="background-color: #23232B">
        <n-log
          ref="logInstRef"
          :log="logRef"
          :rows="26.3"
          :font-size="12"
          :loading="loading"
          trim
        />
      </n-card>
    </section>
    <n-modal v-model:show="showModal" preset="dialog" :title="modalTitle" :mask-closable="false">
      <div v-if="selectMode === 'single'" style="margin-top: 20px">
        <n-radio-group v-model:value="selectedProject">
          <n-radio v-for="p in projectList" :key="p.path" :value="p.path">{{ p.alias }}</n-radio>
        </n-radio-group>
      </div>
      <div v-else style="margin-top: 20px">
        <n-checkbox-group v-model:value="selectedProjects">
          <n-checkbox v-for="p in projectList" :key="p.path" :value="p.path">{{
            p.alias
          }}</n-checkbox>
        </n-checkbox-group>
      </div>
      <template #action>
        <n-button type="info" size="small" @click="onProjectSelectConfirm">确定</n-button>
        <n-button type="info" size="small" @click="showModal = false">取消</n-button>
      </template>
    </n-modal>
    <n-button
      v-if="showCopyButton"
      class="floating-copy-btn"
      type="primary"
      size="large"
      @click="handleCopySummary"
      style="
        position: fixed;
        right: 32px;
        bottom: 32px;
        z-index: 1000;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      "
      circle
    >
      <n-icon size="28"><CopyOutline /></n-icon>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watchEffect } from 'vue'
import type { LogInst } from 'naive-ui'
import {
  NButton,
  NSpace,
  useMessage,
  NLog,
  NCard,
  NModal,
  NRadioGroup,
  NRadio,
  NCheckboxGroup,
  NCheckbox,
  NIcon
} from 'naive-ui'
import { CopyOutline } from '@vicons/ionicons5'
import { chatWithDeepSeek } from '../api/deepseek'
const type = ref<'daily' | 'overtime' | 'weekly'>('daily')
const loading = ref(false)
const message = useMessage()
const logRef = ref('')
const logInstRef = ref<LogInst | null>(null)
const showCopyButton = ref(false)
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
// 获取配置
const settings = getSettings()
const gitUser = settings.gitUser || ''
// 获取本周的提交记录
const weeklyCommand = `git log --since="monday" --author="${gitUser}" --pretty=format:"%an %ad %s" --date=format:"%Y-%m-%d %A"`
// 获取当天到18:30的提交记录
const dailyCommand = `git log --since="00:00" --until="18:30" --author="${gitUser}" --pretty=format:"%an %ad %s" --date=format:"%Y-%m-%d %A"`
// 获取当天18:30到21点的提交记录
const overtimeCommand = `git log --since="18:30" --until="21:00" --author="${gitUser}" --pretty=format:"%an %ad %s" --date=format:"%Y-%m-%d %A"`
// 项目选择相关，单选/多选
interface Project {
  alias: string
  path: string
}
const showModal = ref(false)
const selectMode = ref<'single' | 'multiple'>('single')
const projectList = ref<Project[]>([])
const selectedProject = ref<string>('')
const selectedProjects = ref<string[]>([])
const modalTitle = ref('选择项目')
// 打开项目选择弹窗
const openProjectModal = (summarizeType: 'daily' | 'overtime' | 'weekly') => {
  if (!gitUser) {
    message.warning('请先配置 Git 用户名')
    return
  }
  type.value = summarizeType
  selectMode.value = (summarizeType === 'daily' || summarizeType === 'overtime') ? 'single' : 'multiple'
  modalTitle.value = (summarizeType === 'daily' || summarizeType === 'overtime') ? '选择项目（单选）' : '选择项目（多选）'
  // 读取项目列表
  const raw = localStorage.getItem('githelper-projects')
  projectList.value = raw ? JSON.parse(raw) : []
  selectedProject.value = ''
  selectedProjects.value = []
  showModal.value = true
}
// 选择项目
const onProjectSelectConfirm = async () => {
  if (selectMode.value === 'single' && !selectedProject.value) {
    message.warning('请选择一个项目')
    return
  }
  if (selectMode.value === 'multiple' && selectedProjects.value.length === 0) {
    message.warning('请至少选择一个项目')
    return
  }
  showModal.value = false
  await handleSummarize(type.value)
}
// 总结
const handleSummarize = async (summarizeType: 'daily' | 'overtime' | 'weekly') => {
  try {
    loading.value = true
    // 根据类型选择对应的git命令
    let command = weeklyCommand // 默认周报命令
    if (summarizeType === 'daily') {
      command = dailyCommand
    } else if (summarizeType === 'overtime') {
      command = overtimeCommand
    }

    if (summarizeType === 'daily' || summarizeType === 'overtime') {
      // 单选模式（日报和加班日报）
      logRef.value = ''
      const projectPath = selectedProject.value
      if (!projectPath) return
      const project = projectList.value.find((p) => p.path === projectPath)
      const result = await window.api?.runGitLog({ command, projectPath })
      // 每行加 [别名]
      const prefix = project ? `[${project.alias}] ` : ''
      logRef.value = (result || '')
        .split('\n')
        .map((line) => (line ? prefix + line : ''))
        .join('\n')
    } else {
      // 多选模式（周报）
      logRef.value = ''
      let allLogs = ''
      for (const projectPath of selectedProjects.value) {
        const project = projectList.value.find((p) => p.path === projectPath)
        let result = await window.api?.runGitLog({ command, projectPath })
        const prefix = project ? `[${project.alias}] ` : ''
        allLogs +=
          (result || '')
            .split('\n')
            .map((line) => (line ? `${prefix}${line}` : ''))
            .join('\n') + '\n\n'
      }
      logRef.value = allLogs
    }
    if (!logRef.value || logRef.value.trim() === '') {
      message.error('获取日志失败或没有日志')
      loading.value = false
      return
    }
    await handleSummarizeDeepSeek()
    loading.value = false
  } catch (error) {
    loading.value = false
  }
}
// 调用 deepseek 总结
const handleSummarizeDeepSeek = async () => {
  try {
    const settings = getSettings()
    const token = settings.token || ''
    if (!token) {
      message.error('请先配置 DeepSeek 的 API Key')
      return
    }
    const messages = [{ role: 'user', content: logRef.value }]
    if (type.value === 'daily' || type.value === 'overtime') {
      // 日报和加班日报都使用日报模板
      messages.unshift({ role: 'system', content: settings.dailyTemplate })
    } else {
      // 周报使用周报模板
      messages.unshift({ role: 'system', content: settings.weeklyTemplate })
    }
    // 先在日志最后一行添加分割线
    logRef.value += '\n--------------------\n'
    // 流式输出
    let deepseekText = ''
    const response = await chatWithDeepSeek(messages, token, 'deepseek-chat', true)
    const reader = response.body!.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false
    let buffer = ''
    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      if (value) {
        buffer += decoder.decode(value, { stream: true })
        let lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一行（可能是不完整的）
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.replace('data: ', '')
            if (jsonStr === '[DONE]') continue
            try {
              const data = JSON.parse(jsonStr)
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                deepseekText += content
                logRef.value = logRef.value.replace(
                  /(--------------------\n)[\s\S]*$/,
                  `$1${deepseekText}`
                )
                await new Promise((r) => setTimeout(r, 10))
              }
            } catch {}
          }
        }
      }
    }
    // deepseek 输出完成后显示复制按钮
    await nextTick()
    showCopyButton.value = true
  } catch (error) {
    console.error('DeepSeek 总结失败:', error)
    message.error('DeepSeek 总结失败')
  }
}

// 一键复制分割线下内容
const handleCopySummary = async () => {
  // 提取分割线下内容
  const match = logRef.value.match(/--------------------\n([\s\S]*)$/)
  const summary = match ? match[1] : ''
  if (summary) {
    await navigator.clipboard.writeText(summary)
    message.success('已复制到剪贴板')
  } else {
    message.warning('暂无可复制内容')
  }
}

watchEffect(() => {
  if (logRef.value) {
    nextTick(() => {
      logInstRef.value?.scrollTo({ position: 'bottom', silent: true })
    })
  }
})
</script>

<style scoped lang="scss">
.summarization-panel {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  .content {
    margin-top: 16px;
  }
}
.floating-copy-btn {
  font-size: 18px;
  font-weight: bold;
}
</style>
