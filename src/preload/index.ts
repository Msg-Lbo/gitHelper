import { contextBridge, ipcRenderer } from 'electron'
import type { UpdateInfo, ProgressInfo } from 'electron-updater'

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  runGitLog: (params: { command: string, projectPath: string }) => ipcRenderer.invoke('run-git-log', params),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Updater APIs
  checkForUpdate: () => ipcRenderer.send('check-for-update'),
  startDownloadUpdate: () => ipcRenderer.send('start-download-update'),
  cancelDownloadUpdate: () => ipcRenderer.send('cancel-download-update'),
  quitAndInstallUpdate: () => ipcRenderer.send('quit-and-install-update'),
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) =>
    ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateNotAvailable: (callback: () => void) =>
    ipcRenderer.on('update-not-available', () => callback()),
  onDownloadProgress: (callback: (progress: ProgressInfo) => void) =>
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  onUpdateError: (callback: (error: string) => void) =>
    ipcRenderer.on('update-error', (_event, error) => callback(error)),
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.removeAllListeners('update-not-available')
    ipcRenderer.removeAllListeners('download-progress')
    ipcRenderer.removeAllListeners('update-downloaded')
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
