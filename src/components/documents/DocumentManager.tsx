import { useState, useCallback } from 'react'
import { ArrowLeft, Folder, FolderPlus, File, LoaderCircle, MoreHorizontal, Upload, Trash2, History } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useDocumentStore } from '@/stores/documentStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FileContextMenu } from './FileContextMenu'
import { FolderContextMenu } from './FolderContextMenu'
import { hasPermission } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Department } from '@/lib/types'

interface DocumentManagerProps {
  onOpenRecycleBin: () => void
  onOpenActivityLog: (fileId?: string) => void
}

export function DocumentManager({ onOpenRecycleBin, onOpenActivityLog }: DocumentManagerProps) {
  const user = useAuthStore((s) => s.user)
  const {
    files, folders, selectedFolder, setSelectedFolder,
    deletedFiles, deletedFolders, createFolder, deleteFolder, uploadFiles,
    renameFile, deleteFile, departmentFilter,
  } = useDocumentStore()
  const { toast } = useToast()

  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string; fileName: string } | null>(null)
  const [folderMenu, setFolderMenu] = useState<{ x: number; y: number; folderId: string; folderName: string } | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string; fileCount: number } | null>(null)

  const canManage = user ? hasPermission(user, 'documents.manage') : false
  const showDocumentError = (translationKey: string) => {
    toast({ description: i18n.t(translationKey), variant: 'destructive' })
  }

  const openFileMenuAtPointer = useCallback((event: React.MouseEvent, fileId: string, fileName: string) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ x: event.clientX, y: event.clientY, fileId, fileName })
  }, [])

  const openFolderMenuAtPointer = useCallback((event: React.MouseEvent, folderId: string, folderName: string) => {
    event.preventDefault()
    event.stopPropagation()
    setFolderMenu({ x: event.clientX, y: event.clientY, folderId, folderName })
  }, [])

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !user?.department) return
    createFolder(newFolderName.trim(), (departmentFilter || user.department) as Department)
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const saveImportedDocuments = async (selectedFiles: ImportedDocumentFile[], department: Department, userId: string) => {
    await uploadFiles(selectedFiles.map((file) => ({
      ...file,
      folderId: selectedFolder || '',
      department,
      uploadedBy: userId,
    })))
    toast({
      description: i18n.t('documents.imported').replace('{count}', String(selectedFiles.length)),
      variant: 'success',
    })
  }

  const importSelectedFiles = async () => {
    if (!user || isImporting) return
    const destinationDepartment = departmentFilter || user.department
    if (!destinationDepartment) return showDocumentError('documents.department_required')
    const desktopApi = window.electronAPI
    if (!desktopApi) return showDocumentError('documents.desktop_only')

    setIsImporting(true)
    try {
      const selection = await desktopApi.selectDocumentFiles()
      if (!selection.canceled && selection.files.length > 0) {
        await saveImportedDocuments(selection.files, destinationDepartment as Department, user.id)
      }
    } catch {
      showDocumentError('documents.import_failed')
    } finally {
      setIsImporting(false)
    }
  }

  const saveManagedDocument = async (id: string) => {
    const file = files.find(f => f.id === id)
    if (!file?.url) return
    const desktopApi = window.electronAPI
    if (desktopApi) {
      try {
        const saveOutcome = await desktopApi.saveDocumentFile(file.url, file.name)
        if (saveOutcome.error) throw new Error(saveOutcome.error)
      } catch {
        showDocumentError('documents.save_failed')
      }
      return
    }
    window.open(file.url, '_blank')
  }

  const openManagedDocument = async (id: string) => {
    const file = files.find(f => f.id === id)
    if (!file?.url) return
    const desktopApi = window.electronAPI
    if (desktopApi) {
      try {
        const openOutcome = await desktopApi.openDocumentFile(file.url)
        if (openOutcome.error) throw new Error(openOutcome.error)
      } catch {
        showDocumentError('documents.open_failed')
      }
      return
    }
    window.open(file.url, '_blank')
  }

  const copyDocumentPath = (id: string) => {
    const file = files.find(f => f.id === id)
    if (file?.url) navigator.clipboard.writeText(file.url)
  }

  const requestFolderDeletion = (folderId: string, folderName: string) => {
    const fileCount = files.filter((file) => file.folderId === folderId).length
    setFolderToDelete({ id: folderId, name: folderName, fileCount })
  }

  const confirmFolderDeletion = () => {
    if (!folderToDelete) return
    deleteFolder(folderToDelete.id)
    toast({ description: i18n.t('documents.folder_deleted').replace('{name}', folderToDelete.name), variant: 'success' })
    setFolderToDelete(null)
  }

  const currentFiles = selectedFolder ? files.filter(f => f.folderId === selectedFolder) : files
  const activeFolder = folders.find((folder) => folder.id === selectedFolder)
  const deletedFolderIds = new Set(deletedFolders.map(folder => folder.id))
  const recycleBinItemCount = deletedFolders.length + deletedFiles.filter(file => !deletedFolderIds.has(file.folderId)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {canManage && (
            <>
              <Button variant="primary" size="sm" onClick={importSelectedFiles} disabled={isImporting} aria-busy={isImporting} className="h-8 rounded-lg text-xs font-semibold spring-transition">
                {isImporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {i18n.t(isImporting ? 'documents.importing' : 'documents.add_files')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(!showNewFolder)} className="h-8 rounded-lg text-xs font-semibold spring-transition">
                <FolderPlus className="h-3.5 w-3.5" />
                {i18n.t('documents.new_folder')}
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onOpenRecycleBin} className="h-8 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground spring-transition">
            <Trash2 className="h-3.5 w-3.5" />
            {i18n.t('documents.recycle_bin')}
            {recycleBinItemCount > 0 && <span className="ml-1 text-destructive font-bold">({recycleBinItemCount})</span>}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpenActivityLog()} className="h-8 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground spring-transition">
          <History className="h-3.5 w-3.5" />
          {i18n.t('documents.activity_log')}
        </Button>
      </div>

      {showNewFolder && (
        <div className="flex gap-2" onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }}>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={i18n.t('documents.folder_name_placeholder')}
            className="h-9 text-xs rounded-lg flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} className="h-9 rounded-lg text-xs font-semibold">{i18n.t('create')}</Button>
        </div>
      )}

      {selectedFolder && activeFolder ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/30 p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedFolder(null)}
            aria-label={i18n.t('documents.back_to_all')}
            className="h-8 w-8 shrink-0 rounded-lg"
          >
            <ArrowLeft className={`h-4 w-4 ${i18n.dir === 'rtl' ? 'rotate-180' : ''}`} />
          </Button>
          <Folder className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{activeFolder.name}</p>
            <p className="text-micro text-muted-foreground">
              {i18n.t('documents.folder_file_count').replace('{count}', String(currentFiles.length))}
            </p>
          </div>
        </div>
      ) : folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className={`pressable flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold spring-transition border ${!selectedFolder ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/30 hover:text-foreground'}`}
          >
            <Folder className="h-3.5 w-3.5" />
            {i18n.t('documents.all_files')}
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              onContextMenu={canManage ? (event) => openFolderMenuAtPointer(event, folder.id, folder.name) : undefined}
              className="document-folder-item group flex items-center rounded-lg border border-border/30 bg-card text-muted-foreground spring-transition"
            >
              <button
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className="pressable flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Folder className="h-3.5 w-3.5" />
                {folder.name}
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={(event) => openFolderMenuAtPointer(event, folder.id, folder.name)}
                  aria-label={i18n.t('documents.folder_actions').replace('{name}', folder.name)}
                  className="document-item-actions pressable me-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {currentFiles.length === 0 ? (
          <EmptyState
            icon={<File className="h-8 w-8" />}
            title={i18n.t('documents.no_files')}
            description={i18n.t('documents.no_files_desc')}
          />
        ) : (
          currentFiles.map((file) => (
            <div
              key={file.id}
              onContextMenu={(event) => openFileMenuAtPointer(event, file.id, file.name)}
              className="document-file-row group flex items-center gap-2 rounded-xl border border-border/10 bg-card p-1"
            >
              <button
                type="button"
                onClick={() => openManagedDocument(file.id)}
                aria-label={i18n.t('documents.open_file').replace('{name}', file.name)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{file.name}</span>
                  <span className="block text-micro text-muted-foreground">
                    {file.type} · {(file.size / 1024).toFixed(1)} KB
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={(event) => openFileMenuAtPointer(event, file.id, file.name)}
                aria-label={i18n.t('documents.file_actions').replace('{name}', file.name)}
                className="document-item-actions pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          fileId={contextMenu.fileId}
          fileName={contextMenu.fileName}
          onClose={() => setContextMenu(null)}
          onRename={renameFile}
          onDelete={deleteFile}
          onDownload={saveManagedDocument}
          onCopy={copyDocumentPath}
        />
      )}

      {folderMenu && (
        <FolderContextMenu
          x={folderMenu.x}
          y={folderMenu.y}
          folderName={folderMenu.folderName}
          onClose={() => setFolderMenu(null)}
          onDelete={() => requestFolderDeletion(folderMenu.folderId, folderMenu.folderName)}
        />
      )}

      <ConfirmDialog
        isOpen={!!folderToDelete}
        title={i18n.t('documents.delete_folder_title')}
        description={i18n.t('documents.delete_folder_description')
          .replace('{name}', folderToDelete?.name || '')
          .replace('{count}', String(folderToDelete?.fileCount || 0))}
        confirmText={i18n.t('documents.delete_folder')}
        onConfirm={confirmFolderDeletion}
        onCancel={() => setFolderToDelete(null)}
      />
    </div>
  )
}
