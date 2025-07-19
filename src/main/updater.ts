import { autoUpdater, UpdateInfo, ProgressInfo, CancellationToken } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'

let cancellationToken: CancellationToken | null

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
    cancellationToken = new CancellationToken()
    autoUpdater.downloadUpdate(cancellationToken).catch(() => {
      // 捕获取消错误，此处无需处理，错误事件会统一处理
    })
  })

  // 监听下载进度
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    win.webContents.send('download-progress', progress)
  })

  // 监听更新下载完成
  autoUpdater.on('update-downloaded', () => {
    cancellationToken = null
    win.webContents.send('update-downloaded')
  })

  // 退出并安装更新
  ipcMain.on('quit-and-install-update', () => {
    autoUpdater.quitAndInstall()
  })
  
  // 取消下载更新
  ipcMain.on('cancel-download-update', () => {
    if (cancellationToken) {
      cancellationToken.cancel()
      cancellationToken = null
    }
  })

  // 监听更新错误
  autoUpdater.on('error', (err) => {
    // 用户主动取消下载会触发一个 error，需要将其与真实错误区分开
    if (err.message.includes('Cancelled')) {
      console.log('Download cancelled by user.')
    } else {
      win.webContents.send('update-error', `更新过程中发生错误: ${err.message}`)
    }
  })
  
  // 应用启动后，延迟1秒自动检查更新
  win.once('ready-to-show', () => {
    setTimeout(checkForUpdates, 1000)
  })
}
