import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe API to the webview guest page
contextBridge.exposeInMainWorld('webviewApi', {
  sendToHost: (channel: string, ...args: any[]) => {
    // Whitelist channels to prevent sending arbitrary IPC messages
    const validChannels = ['login-success', 'debug-log']
    if (validChannels.includes(channel)) {
      ipcRenderer.sendToHost(channel, ...args)
    }
  }
}) 