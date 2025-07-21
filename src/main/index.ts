import { app, shell, BrowserWindow, ipcMain, dialog, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import os from 'os'

// 禁用硬件加速（如果GPU有问题）
// app.disableHardwareAcceleration()

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: false, // 无边框，准备自定义工具栏
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true // 允许在渲染进程中使用 <webview> 标签
    }
  })
  // 窗口加载完成
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  // 打开外部链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 恢复加载本地HTML文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // 加载开发URL
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch((err) => {
      console.error('加载开发URL失败:', err)
    })
  } else {
    // 加载HTML文件
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch((err) => {
      console.error('加载HTML文件失败:', err)
    })
  }

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription)
  })

  // 开发环境下打开开发者工具
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 监听所有网络请求的响应头
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // 我们可以根据URL过滤，只打印目标网站的headers
    if (details.url.startsWith('https://ai.mufengweilai.com/')) {
      console.log('OA Page URL:', details.url)
      console.log('OA Page Headers:', details.responseHeaders)
    }
    callback({ responseHeaders: details.responseHeaders })
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })
  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
  ipcMain.handle('run-git-log', async (_, { command, projectPath }) => {
    const isWin = os.platform() === 'win32'
    let fullCommand
    if (isWin) {
      // Windows 下用 cd /d 和不加 export
      fullCommand = `cd /d "${projectPath}" && ${command}`
    } else {
      // Linux/Mac 下加 export
      fullCommand = `cd "${projectPath}" && export LANG=zh_CN.GBK && ${command}`
    }
    return new Promise((resolve, _reject) => {
      exec(fullCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          resolve(stderr || error.message)
        } else {
          resolve(stdout)
        }
      })
    })
  })
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // 创建主窗口
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
