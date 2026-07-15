const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  selectDocumentFiles: () => ipcRenderer.invoke('select-document-files'),
  saveDocumentFile: (sourcePath, suggestedName) => ipcRenderer.invoke('save-document-file', sourcePath, suggestedName),
  openDocumentFile: (filePath) => ipcRenderer.invoke('open-document-file', filePath),
  deleteDocumentFile: (filePath) => ipcRenderer.invoke('delete-document-file', filePath),
  egsUrl: 'https://www.invoicing.egypt.gov.eg',
  onUpdateStatus: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
})
