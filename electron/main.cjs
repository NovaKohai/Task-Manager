const { app, BrowserWindow, Menu, ipcMain, session } = require('electron')
const path = require('path')
const os = require('os')

// electron-updater reads publish config from electron-builder.json automatically,
// so update files are downloaded from your GitHub Releases (no code changes needed there).
const { autoUpdater } = require('electron-updater')

const ghToken = process.env.GH_TOKEN
if (ghToken) {
  autoUpdater.requestHeaders = { authorization: `token ${ghToken}` }
}

const isDev = process.argv.includes('--dev')

// ── Content Security Policy ─────────────────────────────────────────────────
// Applied to every response via onHeadersReceived so it also covers file:// loads.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ')

function sendToRenderer(channel, data) {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send(channel, data)
}

// ── electron-updater event bridge ──────────────────────────────────────────
// Maps autoUpdater events to the {type,...} payloads the React updateStore
// already expects, so the renderer side needs zero changes.
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

autoUpdater.on('update-available', (info) => {
  sendToRenderer('update-status', { type: 'available', version: info.version, releaseNotes: info.releaseNotes, releaseDate: info.releaseDate })
})

autoUpdater.on('update-not-available', () => {
  sendToRenderer('update-status', { type: 'uptodate' })
})

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('update-status', { type: 'progress', percent: Math.round(progress.percent) })
})

autoUpdater.on('update-downloaded', (info) => {
  sendToRenderer('update-status', { type: 'downloaded', version: info.version })
})

autoUpdater.on('error', (err) => {
  sendToRenderer('update-status', { type: 'error', message: err.message })
})

// ── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.handle('get-app-version', () => app.getVersion())

ipcMain.handle('get-system-info', () => {
  try {
    return {
      osType: os.type(),
      osPlatform: os.platform(),
      osArch: os.arch(),
      osRelease: os.release(),
      totalMem: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      freeMem: `${(os.freemem() / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
    }
  } catch (e) {
    return { error: e?.message ?? String(e) }
  }
})

// check-for-updates → autoUpdater.checkForUpdates()
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    const currentVersion = app.getVersion()
    const latestVersion = result ? result.updateInfo.version : currentVersion
    
    // Simple semver numeric comparison (e.g. 1.0.5 > 1.0.4).
    // Does not handle pre-release tags (1.0.6-beta → NaN) — pre-releases
    // are treated as not-newer, which is acceptable for this app.
    const isNewer = (() => {
      const l = latestVersion.split('.').map(Number)
      const c = currentVersion.split('.').map(Number)
      for (let i = 0; i < Math.max(l.length, c.length); i++) {
        const lVal = l[i] || 0
        const cVal = c[i] || 0
        if (lVal > cVal) return true
        if (lVal < cVal) return false
      }
      return false
    })()

    return {
      available: isNewer,
      version: latestVersion,
      releaseNotes: result ? (typeof result.updateInfo.releaseNotes === 'string' ? result.updateInfo.releaseNotes : JSON.stringify(result.updateInfo.releaseNotes)) : '',
      releaseDate: result ? result.updateInfo.releaseDate : '',
    }
  } catch (e) {
    return { available: false, error: e?.message ?? String(e) }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { started: true }
  } catch (e) {
    return { started: false, error: e?.message ?? String(e) }
  }
})

ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall()
  } catch (e) {
    return { error: e?.message ?? String(e) }
  }
})

// ── Splash Window ────────────────────────────────────────────────────────────
// A lightweight frameless window shown while the main React app loads.
// Closed automatically once the main window emits 'ready-to-show'.

function createSplashWindow() {
  splashStartTime = Date.now()
  const splash = new BrowserWindow({
    width: 440,
    height: 540,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    backgroundColor: '#0D0F14',
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      sandbox: true,
    },
  })

  splash.loadFile(path.join(__dirname, 'splash.html'))
  splash.on('closed', () => { splashWin = null })

  return splash
}

let splashWin = null
let splashStartTime = 0

// ── Main Window ──────────────────────────────────────────────────────────────

function createWindow(skipSplash) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: skipSplash,
    title: 'Team Task Manager',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL('http://localhost:5173')

    if (!skipSplash) {
      win.once('ready-to-show', () => {
        const elapsed = Date.now() - splashStartTime
        const delay = Math.max(0, 1200 - elapsed)
        setTimeout(() => {
          if (splashWin && !splashWin.isDestroyed()) {
            splashWin.close()
            splashWin = null
          }
          win.show()
          win.focus()
        }, delay)
      })
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))

    win.once('ready-to-show', () => {
      const elapsed = Date.now() - splashStartTime
      const delay = Math.max(0, 1200 - elapsed)
      setTimeout(() => {
        if (splashWin && !splashWin.isDestroyed()) {
          splashWin.close()
          splashWin = null
        }
        win.show()
        win.focus()
      }, delay)
    })
  }

  // DevTools shortcut only fires in dev mode — silently ignored in production.
  win.webContents.on('before-input-event', (event, input) => {
    if (isDev && input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools()
    }
  })

  return win
}

app.whenReady().then(() => {
  // Apply CSP on every response so both the initial HTML and any sub-requests
  // (iframe, print, etc.) receive it. Works for file:// loads where <meta> would not.
  session.defaultSession.webRequest.onHeadersReceived((_details, callback) => {
    callback({
      responseHeaders: {
        ..._details.responseHeaders,
        'Content-Security-Policy': [CSP],
      },
    })
  })

  if (isDev) {
    // Dev mode: show main window immediately (Vite dev server is fast)
    const devWin = createWindow(true)
    devWin.webContents.openDevTools()
  } else {
    // Production: show splash while React loads
    splashWin = createSplashWindow()
    createWindow(false)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})