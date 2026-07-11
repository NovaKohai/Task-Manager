/// <reference types="vite/client" />

interface UpdateCommit {
  hash: string
  message: string
}

interface UpdateResult {
  available: boolean
  commits: UpdateCommit[]
  error?: string
}

interface ApplyResult {
  success: boolean
  before?: string
  after?: string
  changed?: boolean
  error?: string
}

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  checkForUpdates: () => Promise<UpdateResult>
  applyUpdate: () => Promise<ApplyResult>
}

interface Window {
  electronAPI?: ElectronAPI
}
