import { useEffect, useRef, useState } from 'react'
import { Download, Pencil, Copy, Trash2, X } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Input } from '@/components/ui/input'

interface FileContextMenuProps {
  x: number
  y: number
  fileId: string
  fileName: string
  onClose: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onDownload: (id: string) => void
  onCopy: (id: string) => void
}

export function FileContextMenu({ x, y, fileId, fileName, onClose, onRename, onDelete, onDownload, onCopy }: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(fileName)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('mousedown', closeOnOutsideClick); document.removeEventListener('keydown', closeOnEscape) }
  }, [onClose])

  const commitRename = () => {
    if (newName.trim() && newName !== fileName) onRename(fileId, newName.trim())
    onClose()
  }

  const fileActions = [
    { icon: Download, label: i18n.t('documents.download'), onClick: () => { onDownload(fileId); onClose() } },
    { icon: Pencil, label: i18n.t('documents.rename'), onClick: () => setRenaming(true) },
    { icon: Copy, label: i18n.t('documents.copy'), onClick: () => { onCopy(fileId); onClose() } },
    { icon: Trash2, label: i18n.t('documents.delete'), onClick: () => { onDelete(fileId); onClose() }, danger: true },
  ]

  const menuX = Math.min(x, window.innerWidth - 180)
  const menuY = Math.min(y, window.innerHeight - 200)
  const menuOrigin = `${menuX < x ? 'right' : 'left'} ${menuY < y ? 'bottom' : 'top'}`

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={fileName}
      className="document-context-menu fixed z-50 min-w-44 rounded-xl border border-border/50 bg-card py-1 shadow-raised"
      style={{ left: menuX, top: menuY, transformOrigin: menuOrigin }}
    >
      {renaming ? (
        <div className="px-2 py-2" onKeyDown={(event) => { if (event.key === 'Enter') commitRename() }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-xs rounded-lg"
            autoFocus
          />
          <div className="flex gap-1 mt-1.5">
            <button type="button" onClick={commitRename} className="pressable flex-1 rounded-lg bg-primary py-1 text-xs font-semibold text-primary-foreground spring-transition hover:opacity-90">{i18n.t('save')}</button>
            <button type="button" aria-label={i18n.t('cancel')} onClick={() => { setRenaming(false); onClose() }} className="pressable flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground spring-transition hover:bg-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ) : (
        fileActions.map((action) => (
          <button
            type="button"
            role="menuitem"
            key={action.label}
            onClick={action.onClick}
            className={`pressable flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold spring-transition ${action.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted'}`}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0" />
            {action.label}
          </button>
        ))
      )}
    </div>
  )
}
