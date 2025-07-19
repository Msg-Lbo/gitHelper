<template>
    <n-modal v-model:show="show" preset="dialog" title="版本更新" :mask-closable="false" :close-on-esc="false">
        <template #header>
            <div>发现新版本 v{{ updateInfo?.version }}</div>
        </template>
        <div v-if="!downloaded">
            <p>更新内容：</p>
            <n-scrollbar style="max-height: 200px">
                <div v-html="releaseNotesHtml" class="release-notes"></div>
            </n-scrollbar>
            <div v-if="downloading" class="progress-container">
                <n-progress type="line" :percentage="downloadProgress.percent" :indicator-placement="'inside'" processing />
                <p class="progress-text">
                    {{ (downloadProgress.transferred / 1024 / 1024).toFixed(2) }}MB /
                    {{ (downloadProgress.total / 1024 / 1024).toFixed(2) }}MB
                </p>
            </div>
        </div>
        <div v-else>
            <p>新版本已下载完成，是否立即安装？</p>
        </div>
        <template #action>
            <div v-if="!downloaded">
                <n-space gap="10px" justify="end">
                    <n-button type="primary" @click="startDownload" :disabled="downloading">
                        {{ downloading ? '正在下载...' : '立即下载' }}
                    </n-button>
                    <n-button v-if="downloading" type="error" @click="cancelDownload">取消</n-button>
                    <n-button @click="show = false" :disabled="downloading">稍后</n-button>
                </n-space>
            </div>
            <div v-else>
                <n-space gap="10px" justify="end">
                    <n-button type="primary" @click="installUpdate">立即安装</n-button>
                    <n-button @click="show = false">取消</n-button>
                </n-space>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NButton, NProgress, NScrollbar, NSpace } from 'naive-ui'
import type { UpdateInfo, ProgressInfo } from 'electron-updater'
import { marked } from 'marked'

const props = defineProps<{
    showModal: boolean
    updateInfo: UpdateInfo | null
    downloadProgress: ProgressInfo
    downloading: boolean
    downloaded: boolean
}>()

const emit = defineEmits(['update:showModal', 'start-download', 'install-update', 'cancel-download'])

const show = computed({
    get: () => props.showModal,
    set: (value) => emit('update:showModal', value)
})

const releaseNotesHtml = computed(() => {
    if (props.updateInfo?.releaseNotes) {
        const notes =
            typeof props.updateInfo.releaseNotes === 'string'
                ? props.updateInfo.releaseNotes
                : props.updateInfo.releaseNotes.map((note) => note.note).join('\n')
        return marked(notes)
    }
    return ''
})

const startDownload = () => {
    emit('start-download')
}

const installUpdate = () => {
    emit('install-update')
}

const cancelDownload = () => {
    emit('cancel-download')
}
</script>

<style scoped>
.progress-container {
    margin-top: 20px;
}

.progress-text {
    text-align: center;
    margin-top: 5px;
}

.release-notes {
    background: #2a2a2e;
    /* 改为深色背景 */
    padding: 12px;
    border-radius: 4px;
}

.release-notes :deep(p) {
    margin: 0;
    color: inherit;
    /* 继承父元素颜色 */
}
</style>