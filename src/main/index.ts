import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import os from 'os'

// 解决 Windows 控制台中文输出乱码问题
if (process.platform === 'win32') {
  const iconv = require('iconv-lite')
  const stream = require('stream')

  const writable = new stream.Writable({
    write: function (chunk, _encoding, next) {
      if (process.stdout.writable) {
        process.stdout.write(iconv.encode(chunk.toString(), 'gbk'))
      }
      next()
    }
  })

  // 重写 console.log
  console.log = (...args) => {
    const output = args.map((arg) => String(arg)).join(' ')
    writable.write(output + '\n')
  }
  console.error = console.log
}

// 设置命令行参数，解决缓存和GPU相关错误
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-gpu-process-crash-limit')
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

// 设置编码，解决中文乱码问题
app.commandLine.appendSwitch('lang', 'zh-CN')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

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
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      .catch(err => {
        console.error('加载开发URL失败:', err)
      })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      .catch(err => {
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

  // 创建主窗口
  const mainWindow = createWindow()

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
