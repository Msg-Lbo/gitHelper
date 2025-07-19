import { ElectronAPI } from '@electron-toolkit/preload'
import type { UpdateInfo, ProgressInfo } from 'electron-updater'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimize: () => void
      close: () => void
      selectDirectory: () => Promise<string | null>
      runGitLog: (params: { command: string; projectPath: string }) => Promise<string>
      getAppVersion: () => Promise<string>
      // Updater APIs
      checkForUpdate: () => void
      startDownloadUpdate: () => void
      cancelDownloadUpdate: () => void
      quitAndInstallUpdate: () => void
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
      onUpdateNotAvailable: (callback: () => void) => void
      onDownloadProgress: (callback: (progress: ProgressInfo) => void) => void
      onUpdateDownloaded: (callback: () => void) => void
      onUpdateError: (callback: (error: string) => void) => void
      removeAllUpdateListeners: () => void
    }
  }
}
