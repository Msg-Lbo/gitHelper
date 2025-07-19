import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'

export function updater(win: BrowserWindow) {
  // 关闭自动下载，让用户点击后再开始下载
  autoUpdater.autoDownload = false

  // 检查更新的统一处理函数
  const checkForUpdates = () => {
    autoUpdater.checkForUpdates().catch((err) => {
      win.webContents.send('update-error', `检查更新失败: ${err.message}`)
    })
  }
  
  // 触发检查更新
  ipcMain.on('check-for-update', checkForUpdates)

  // 监听发现可用更新
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    win.webContents.send('update-available', info)
  })

  // 监听没有可用更新
  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update-not-available')
  })

  // 开始下载更新
  ipcMain.on('start-download-update', () => {
    autoUpdater.downloadUpdate().catch((err) => {
      win.webContents.send('update-error', `下载更新失败: ${err.message}`)
    })
  })

  // 监听下载进度
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
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
    win.webContents.send('update-error', `更新过程中发生错误: ${err.message}`)
  })
  
  // 应用启动后，延迟1秒自动检查更新
  win.once('ready-to-show', () => {
    setTimeout(checkForUpdates, 1000)
  })
}
