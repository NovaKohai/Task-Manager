import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { i18n } from '@/lib/i18n'

interface FolderContextMenuProps {
  x: number
  y: number
  folderName: string
  onClose: () => void
  onDelete: () => void
}

export function FolderContextMenu({ x, y, folderName, onClose, onDelete }: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const menuX = Math.min(x, window.innerWidth - 180)
  const menuY = Math.min(y, window.innerHeight - 80)
  const menuOrigin = `${menuX < x ? 'right' : 'left'} ${menuY < y ? 'bottom' : 'top'}`

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={folderName}
      className="document-context-menu fixed z-50 min-w-44 rounded-xl border border-border/50 bg-card py-1 shadow-raised"
      style={{ left: menuX, top: menuY, transformOrigin: menuOrigin }}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => { onDelete(); onClose() }}
        className="pressable flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-destructive spring-transition hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        {i18n.t('documents.delete_folder')}
      </button>
    </div>
  )
}
