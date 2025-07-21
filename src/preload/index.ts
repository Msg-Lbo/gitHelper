import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  runGitLog: (params: { command: string, projectPath: string }) => ipcRenderer.invoke('run-git-log', params),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getWebviewPreloadPath: () => ipcRenderer.invoke('get-webview-preload-path'),
  clearOASession: () => ipcRenderer.send('clear-oa-session'),
  // Expose ipcRenderer.on and ipcRenderer.send for two-way communication
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
        on: (channel: string, func: (...args: any[]) => void) =>
          ipcRenderer.on(channel, (_event, ...args) => func(...args)),
        invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
