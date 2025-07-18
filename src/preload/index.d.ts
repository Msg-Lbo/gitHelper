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
    }
  }
}
