/// <reference types="vite/client" />

interface UpdateInfo {
  available: boolean
  version?: string
  releaseNotes?: string
  releaseDate?: string
}

interface UpdateProgress {
  type: 'progress'
  percent: number
  bytesPerSecond: number
}

interface UpdateDownloaded {
  type: 'downloaded'
}

interface UpdateError {
  type: 'error'
  message: string
}

type UpdateStatus = UpdateProgress | UpdateDownloaded | UpdateError

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  checkForUpdates: () => Promise<UpdateInfo>
  downloadUpdate: () => Promise<{ started: boolean }>
  installUpdate: () => Promise<void>
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
