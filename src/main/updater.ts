import { autoUpdater, UpdateInfo } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

// 关闭自动下载
autoUpdater.autoDownload = false

export function updater(win: BrowserWindow) {
  // 检查更新
  ipcMain.on('check-for-update', () => {
    // 在开发模式下模拟更新
    if (is.dev) {
      const updateInfo: UpdateInfo = {
        version: '2.0.0',
        files: [],
        path: '',
        sha512: '',
        releaseName: 'v2.0.0',
        releaseNotes: '这是一个测试更新，包含了一些新功能和bug修复。',
        releaseDate: new Date().toISOString()
      }
      setTimeout(() => {
        win.webContents.send('update-available', updateInfo)
      }, 1000)
    } else {
      autoUpdater.checkForUpdates().catch((err) => {
        win.webContents.send('update-error', err.message)
      })
    }
  })

  // 监听发现可用更新
  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update-available', info)
  })

  // 监听没有可用更新
  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update-not-available')
  })

  // 开始下载更新
  ipcMain.on('start-download-update', () => {
    if (is.dev) {
      // 在开发模式下模拟下载
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        win.webContents.send('download-progress', {
          percent: progress,
          total: 1024 * 1024 * 10, // 10MB
          transferred: (1024 * 1024 * 10 * progress) / 100,
          bytesPerSecond: 1024 * 1024 * 2
        })
        if (progress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            win.webContents.send('update-downloaded')
          }, 1000)
        }
      }, 500)
    } else {
      autoUpdater.downloadUpdate().catch((err) => {
        win.webContents.send('update-error', err.message)
      })
    }
  })

  // 监听下载进度
  autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('download-progress', progress)
  })

  // 监听更新下载完成
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update-downloaded')
  })

  // 退出并安装更新
  ipcMain.on('quit-and-install-update', () => {
    autoUpdater.quitAndInstall()
  })

  // 监听更新错误
  autoUpdater.on('error', (err) => {
    win.webContents.send('update-error', err.message)
  })
}
