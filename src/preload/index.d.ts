import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimize: () => void
      close: () => void
      selectDirectory: () => Promise<string | null>
      runGitLog: (params: { command: string; projectPath: string }) => Promise<string>
      getAppVersion: () => Promise<string>
    }
  }
}
