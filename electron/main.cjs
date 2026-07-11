const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const { execSync } = require('child_process')

const isDev = process.argv.includes('--dev')
const REPO_DIR = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname

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

ipcMain.handle('get-app-version', () => {
  try {
    return execSync('git describe --tags --abbrev=0 2>nul || git rev-parse --short HEAD', { cwd: REPO_DIR }).toString().trim()
  } catch {
    return 'unknown'
  }
})

ipcMain.handle('check-for-updates', () => {
  try {
    execSync('git fetch origin', { cwd: REPO_DIR, timeout: 30000 })
    const log = execSync('git log HEAD..origin/main --oneline', { cwd: REPO_DIR, timeout: 10000 }).toString().trim()
    if (!log) return { available: false, commits: [] }
    const commits = log.split('\n').map(line => ({ hash: line.split(' ')[0], message: line.slice(line.indexOf(' ') + 1) }))
    return { available: true, commits }
  } catch (err) {
    return { available: false, commits: [], error: err.message }
  }
})

ipcMain.handle('apply-update', () => {
  try {
    const before = execSync('git rev-parse HEAD', { cwd: REPO_DIR }).toString().trim()
    execSync('git pull origin main', { cwd: REPO_DIR, timeout: 60000 })
    const after = execSync('git rev-parse HEAD', { cwd: REPO_DIR }).toString().trim()
    return { success: true, before, after, changed: before !== after }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
