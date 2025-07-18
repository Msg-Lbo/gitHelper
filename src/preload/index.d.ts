import { ElectronAPI } from '@electron-toolkit/preload'

interface UpdateInfo {
  version: string
  releaseNotes: string
  downloadUrl: string
  size: number
  publishedAt: string
}

interface DownloadProgress {
  progress: number
  downloadedSize: number
  totalSize: number
  speed: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimize: () => void
      close: () => void
      selectDirectory: () => Promise<string | null>
      runGitLog: (params: { command: string, projectPath: string }) => Promise<string>
      // 更新相关API
      checkForUpdate: () => Promise<{ hasUpdate: boolean; updateInfo?: UpdateInfo; error?: string }>
      downloadAndApplyUpdate: (updateInfo: UpdateInfo) => Promise<{ success: boolean; error?: string }>
      restartApp: () => Promise<void>
      // 更新事件监听
      onUpdateAvailable: (callback: (updateInfo: UpdateInfo) => void) => void
      onUpdateChecking: (callback: (checking: boolean) => void) => void
      onUpdateDownloading: (callback: (downloading: boolean) => void) => void
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
      onUpdateExtracting: (callback: (extracting: boolean) => void) => void
      onUpdateReady: (callback: (ready: boolean) => void) => void
      onUpdateError: (callback: (error: string) => void) => void
      removeAllUpdateListeners: () => void
    }
  }
}
