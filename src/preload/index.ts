import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  runGitLog: (params: { command: string, projectPath: string }) => ipcRenderer.invoke('run-git-log', params),
  // 新的增量更新 API
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  downloadAndApplyUpdate: (updateInfo: any) => ipcRenderer.invoke('download-and-apply-update', updateInfo),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  // 监听更新事件
  onUpdateAvailable: (callback: (updateInfo: any) => void) => {
    ipcRenderer.on('update-available', (_, updateInfo) => callback(updateInfo))
  },
  onUpdateChecking: (callback: (checking: boolean) => void) => {
    ipcRenderer.on('update-checking', (_, checking) => callback(checking))
  },
  onUpdateDownloading: (callback: (downloading: boolean) => void) => {
    ipcRenderer.on('update-downloading', (_, downloading) => callback(downloading))
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
  },
  onUpdateExtracting: (callback: (extracting: boolean) => void) => {
    ipcRenderer.on('update-extracting', (_, extracting) => callback(extracting))
  },
  onUpdateReady: (callback: (ready: boolean) => void) => {
    ipcRenderer.on('update-ready', (_, ready) => callback(ready))
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
  },
  // 移除监听器
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.removeAllListeners('update-checking')
    ipcRenderer.removeAllListeners('update-downloading')
    ipcRenderer.removeAllListeners('download-progress')
    ipcRenderer.removeAllListeners('update-extracting')
    ipcRenderer.removeAllListeners('update-ready')
    ipcRenderer.removeAllListeners('update-error')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
