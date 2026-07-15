/// <reference types="vite/client" />

interface UpdateInfo {
  available: boolean
  version?: string
  releaseNotes?: string
  releaseDate?: string
  error?: string
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

interface ImportedDocumentFile {
  name: string
  size: number
  type: string
  url: string
}

interface DocumentFileDialogResult {
  canceled: boolean
  files: ImportedDocumentFile[]
}

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  checkForUpdates: () => Promise<UpdateInfo>
  downloadUpdate: () => Promise<{ started: boolean }>
  installUpdate: () => Promise<{ error?: string } | void>
  getSystemInfo: () => Promise<any>
  selectDocumentFiles: () => Promise<DocumentFileDialogResult>
  saveDocumentFile: (sourcePath: string, suggestedName: string) => Promise<{ saved: boolean; canceled?: boolean; filePath?: string; error?: string }>
  openDocumentFile: (filePath: string) => Promise<{ opened: boolean; error?: string }>
  deleteDocumentFile: (filePath: string) => Promise<{ deleted: boolean; error?: string }>
  egsUrl: string
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
  webkitAudioContext?: typeof AudioContext
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: any
  }
}
