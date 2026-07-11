const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const isDev = process.argv.includes('--dev')

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Team Task Manager',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function sendToRenderer(channel, data) {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send(channel, data)
}

ipcMain.handle('get-app-version', () => app.getVersion())

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result || !result.updateInfo) return { available: false }
    const current = app.getVersion()
    const latest = result.updateInfo.version
    if (latest === current && !result.updateInfo.releaseNotes) return { available: false }
    return {
      available: true,
      version: latest,
      releaseNotes: result.updateInfo.releaseNotes || '',
      releaseDate: result.updateInfo.releaseDate,
    }
  } catch {
    return { available: false }
  }
})

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate()
  return { started: true }
})

ipcMain.handle('install-update', () => {
  setImmediate(() => autoUpdater.quitAndInstall())
})

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('update-status', { type: 'progress', percent: Math.round(progress.percent), bytesPerSecond: progress.bytesPerSecond })
})

autoUpdater.on('update-downloaded', () => {
  sendToRenderer('update-status', { type: 'downloaded' })
})

autoUpdater.on('error', (err) => {
  sendToRenderer('update-status', { type: 'error', message: err.message })
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
