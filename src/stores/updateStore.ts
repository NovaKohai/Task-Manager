import { create } from 'zustand'
import { toast } from '@/hooks/use-toast'
import { i18n } from '@/lib/i18n'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'uptodate'
  | 'error'
  | 'downloading'
  | 'downloaded'
  | 'done'

interface UpdateState {
  status: UpdateStatus
  info: UpdateInfo | null
  version: string
  progress: number
  error: string
  dialogOpen: boolean
}

interface UpdateActions {
  check: () => Promise<void>
  download: () => Promise<void>
  install: () => Promise<void>
  dismiss: (version?: string) => void
  openDialog: () => void
  closeDialog: () => void
}

type UpdateStore = UpdateState & UpdateActions

let listenerCleanup: (() => void) | null = null

function subscribeOnce() {
  if (listenerCleanup || !window.electronAPI) return
  listenerCleanup = window.electronAPI.onUpdateStatus((status) => {
    if (status.type === 'progress') {
      useUpdateStore.setState({ status: 'downloading', progress: status.percent })
    } else if (status.type === 'downloaded') {
      useUpdateStore.setState({ status: 'downloaded' })
      toast({ title: i18n.t('update.notification_title'), description: i18n.t('update.ready'), variant: 'success' })
    } else if (status.type === 'error') {
      useUpdateStore.setState({ status: 'error', error: status.message })
      toast({ title: i18n.t('update.failed'), description: status.message, variant: 'destructive' })
    }
  })
}

const initial: UpdateState = {
  status: 'idle',
  info: null,
  version: '',
  progress: 0,
  error: '',
  dialogOpen: false,
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  ...initial,

  check: async () => {
    if (!window.electronAPI) return
    subscribeOnce()
    set({ status: 'checking', error: '' })
    try {
      const version = await window.electronAPI.getAppVersion()
      const result = await window.electronAPI.checkForUpdates()
      if (result.error) {
        set({ status: 'error', version, error: result.error })
      } else if (result.available) {
        set({ status: 'available', version, info: result })
      } else {
        set({ status: 'uptodate', version })
      }
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  },

  download: async () => {
    if (!window.electronAPI) return
    set({ status: 'downloading', progress: 0 })
    try {
      await window.electronAPI.downloadUpdate()
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  },

  install: async () => {
    if (!window.electronAPI) return
    window.electronAPI.installUpdate()
  },

  dismiss: (version?: string) => {
    if (version) localStorage.setItem('dismissed_update', version)
    set({ dialogOpen: false, info: null, status: 'idle', error: '', progress: 0 })
  },

  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
}))

export function initUpdateCheck() {
  if (!window.electronAPI) return
  subscribeOnce()
  const dismissed = localStorage.getItem('dismissed_update')
  window.electronAPI.checkForUpdates().then((result) => {
    if (result.available && result.version !== dismissed) {
      useUpdateStore.setState({ info: result, dialogOpen: true })
    }
  })
}
