const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.argv.includes('--dev')
let latestReleaseInfo = null
let downloadedInstallerPath = null

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

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools()
    }
  })
}

function sendToRenderer(channel, data) {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send(channel, data)
}

ipcMain.handle('get-app-version', () => app.getVersion())

ipcMain.handle('check-for-updates', async () => {
  try {
    const res = await fetch('https://api.github.com/repos/NovaKohai/Task-Manager/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
    if (res.status === 403) {
      const retryAfter = res.headers.get('X-RateLimit-Reset')
      const resetTime = retryAfter ? new Date(parseInt(retryAfter) * 1000).toLocaleTimeString() : 'later'
      return { available: false, error: `Rate limited by GitHub. Try again after ${resetTime}` }
    }
    if (res.status === 404) return { available: false, error: 'Release not found' }
    if (!res.ok) return { available: false, error: `GitHub API error: ${res.status} ${res.statusText}` }
    const release = await res.json()
    latestReleaseInfo = release
    const latest = release.tag_name.replace(/^v/, '')
    const current = app.getVersion()
    const c = current.split('.').map(Number)
    const l = latest.split('.').map(Number)
    const isNewer = l[0] > c[0] || (l[0] === c[0] && l[1] > c[1]) || (l[0] === c[0] && l[1] === c[1] && l[2] > c[2])
    if (!isNewer) return { available: false }
    return {
      available: true,
      version: latest,
      releaseNotes: release.body || '',
      releaseDate: release.published_at,
    }
  } catch (e) {
    return { available: false, error: e?.message ?? String(e) }
  }
})

ipcMain.handle('download-update', async () => {
  if (!latestReleaseInfo) return { started: false, error: 'No update info. Check for updates first.' }
  const asset = latestReleaseInfo.assets?.find(a => a.name.endsWith('.exe') && !a.name.includes('__uninstaller'))
  if (!asset) return { started: false, error: 'No installer asset found in release' }
  const ext = path.extname(asset.name)
  const base = path.basename(asset.name, ext)
  const dest = path.join(app.getPath('temp'), `${base}.${Date.now()}${ext}`)
  try {
    const response = await fetch(asset.browser_download_url)
    if (!response.ok) return { started: false, error: `Download failed: HTTP ${response.status}` }
    const total = parseInt(response.headers.get('content-length') || '0', 10)
    const reader = response.body.getReader()
    const writer = fs.createWriteStream(dest)
    let downloaded = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      writer.write(Buffer.from(value))
      downloaded += value.length
      if (total) {
        sendToRenderer('update-status', { type: 'progress', percent: Math.round((downloaded / total) * 100), bytesPerSecond: 0 })
      }
    }
    await new Promise(ok => writer.end(ok))
    downloadedInstallerPath = dest
    sendToRenderer('update-status', { type: 'downloaded' })
    return { started: true }
  } catch (e) {
    return { started: false, error: e?.message ?? String(e) }
  }
})

ipcMain.handle('install-update', async () => {
  if (!downloadedInstallerPath) return
  try {
    const stat = fs.statSync(downloadedInstallerPath)
    if (stat.size < 1000000) {
      sendToRenderer('update-status', { type: 'error', message: `Corrupted download: only ${Math.round(stat.size / 1024)} KB` })
      return
    }
  } catch (e) {
    sendToRenderer('update-status', { type: 'error', message: e?.message ?? String(e) })
    return
  }
  try {
    const err = await shell.openPath(downloadedInstallerPath)
    if (err) {
      sendToRenderer('update-status', { type: 'error', message: err })
      return
    }
    setTimeout(() => {
      app.quit()
    }, 1000)
  } catch (e) {
    sendToRenderer('update-status', { type: 'error', message: e?.message ?? String(e) })
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
