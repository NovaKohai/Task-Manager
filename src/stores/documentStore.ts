import { create } from 'zustand'
import type { DocumentFile, DocumentFolder, ActivityLog, Department } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuthStore } from './authStore'
import { yieldToUI } from '@/lib/utils'

interface DocumentState {
  files: DocumentFile[]
  folders: DocumentFolder[]
  deletedFolders: DocumentFolder[]
  activityLog: ActivityLog[]
  deletedFiles: DocumentFile[]
  selectedFolder: string | null
  departmentFilter: Department | null
  isLoading: boolean
  setSelectedFolder: (id: string | null) => void
  setDepartmentFilter: (dept: Department | null) => void
  fetchDocuments: () => void
  fetchActivityLog: (fileId?: string) => void
  createFolder: (name: string, department: Department) => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  restoreFolder: (id: string) => void
  permanentDeleteFolder: (id: string) => Promise<void>
  uploadFiles: (files: Omit<DocumentFile, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]) => Promise<void>
  renameFile: (id: string, name: string) => void
  deleteFile: (id: string) => void
  restoreFile: (id: string) => void
  permanentDeleteFile: (id: string) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  files: [],
  folders: [],
  deletedFolders: [],
  activityLog: [],
  deletedFiles: [],
  selectedFolder: null,
  departmentFilter: null,
  isLoading: false,

  setSelectedFolder: (id) => set({ selectedFolder: id }),
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),

  fetchDocuments: () => {
    const user = useAuthStore.getState().user
    if (!user) return
    const dept = get().departmentFilter
    set({
      files: db.getDocumentFiles(dept ?? undefined),
      folders: db.getDocumentFolders(dept ?? undefined),
      deletedFolders: db.getDeletedDocumentFolders(dept ?? undefined),
      deletedFiles: db.getDeletedDocumentFiles(dept ?? undefined),
    })
  },

  fetchActivityLog: (fileId) => {
    set({ activityLog: db.getDocumentActivityLog(fileId) })
  },

  createFolder: (name, department) => {
    const user = useAuthStore.getState().user
    if (!user) return
    db.createDocumentFolder({ name, parentId: null, department, createdBy: user.id })
    get().fetchDocuments()
  },

  renameFolder: (id, name) => {
    db.updateDocumentFolder(id, { name })
    get().fetchDocuments()
  },

  deleteFolder: (id) => {
    const user = useAuthStore.getState().user
    if (!user) return
    db.deleteDocumentFolder(id, user.id)
    if (get().selectedFolder === id) set({ selectedFolder: null })
    get().fetchDocuments()
  },

  restoreFolder: (id) => {
    const user = useAuthStore.getState().user
    if (!user) return
    db.restoreDocumentFolder(id, user.id)
    get().fetchDocuments()
  },

  permanentDeleteFolder: async (id) => {
    const folderFiles = db.getDocumentFilesInFolder(id)
    for (const file of folderFiles) {
      if (!file.url || !window.electronAPI?.deleteDocumentFile) continue
      const diskRemoval = await window.electronAPI.deleteDocumentFile(file.url)
      if (!diskRemoval.deleted) return
    }
    db.permanentDeleteDocumentFolder(id)
    get().fetchDocuments()
  },

  uploadFiles: async (files) => {
    await yieldToUI()
    for (const file of files) db.createDocumentFile(file)
    get().fetchDocuments()
  },

  renameFile: (id, name) => {
    const user = useAuthStore.getState().user
    db.updateDocumentFile(id, { name }, user?.id)
    get().fetchDocuments()
  },

  deleteFile: (id) => {
    const user = useAuthStore.getState().user
    if (!user) return
    db.softDeleteDocumentFile(id, user.id)
    get().fetchDocuments()
  },

  restoreFile: (id) => {
    const user = useAuthStore.getState().user
    if (!user) return
    db.restoreDocumentFile(id, user.id)
    get().fetchDocuments()
  },

  permanentDeleteFile: async (id) => {
    const file = get().deletedFiles.find((candidate) => candidate.id === id)
    if (file?.url && window.electronAPI?.deleteDocumentFile) {
      const diskRemoval = await window.electronAPI.deleteDocumentFile(file.url)
      if (!diskRemoval.deleted) return
    }
    db.permanentDeleteDocumentFile(id)
    get().fetchDocuments()
  },
}))
