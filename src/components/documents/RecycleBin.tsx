import { File, Folder, Trash2, RotateCcw, Skull } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DocumentFile, DocumentFolder } from '@/lib/types'

interface RecycleBinProps {
  files: DocumentFile[]
  folders: DocumentFolder[]
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
  onRestoreFolder: (id: string) => void
  onPermanentDeleteFolder: (id: string) => void
}

export function RecycleBin({
  files,
  folders,
  onRestore,
  onPermanentDelete,
  onRestoreFolder,
  onPermanentDeleteFolder,
}: RecycleBinProps) {
  const deletedFolderIds = new Set(folders.map(folder => folder.id))
  const visibleFiles = files.filter(file => !deletedFolderIds.has(file.folderId))
  const itemCount = folders.length + visibleFiles.length

  if (itemCount === 0) {
    return (
      <EmptyState
        icon={<Trash2 className="h-8 w-8" />}
        title={i18n.t('documents.recycle_bin_empty')}
        description={i18n.t('documents.recycle_bin_empty_desc')}
      />
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">{i18n.t('documents.recycle_bin_count').replace('{count}', String(itemCount))}</p>
      {folders.map((folder) => {
        const fileCount = files.filter(file => file.folderId === folder.id).length
        return (
          <div key={folder.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/20 spring-transition">
            <Folder className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{folder.name}</p>
              <p className="text-micro text-muted-foreground">
                {i18n.t('documents.recycle_folder_details').replace('{count}', String(fileCount))}
                {' · '}
                {new Date(folder.deletedAt!).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onRestoreFolder(folder.id)} title={i18n.t('documents.restore_folder')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-success">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onPermanentDeleteFolder(folder.id)} title={i18n.t('documents.permanent_delete_folder')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
                <Skull className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
      {visibleFiles.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/20 spring-transition">
          <File className="h-4 w-4 me-3 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <p className="text-micro text-muted-foreground">
              {new Date(file.deletedAt!).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onRestore(file.id)} title={i18n.t('documents.restore')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-success">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onPermanentDelete(file.id)} title={i18n.t('documents.permanent_delete')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
              <Skull className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
