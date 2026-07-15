import { X, History } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import type { ActivityLog } from '@/lib/types'

interface AuditLogSidebarProps {
  logs: ActivityLog[]
  open: boolean
  onClose: () => void
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    uploaded: 'documents.action.uploaded',
    renamed: 'documents.action.renamed',
    moved: 'documents.action.moved',
    copied: 'documents.action.copied',
    deleted: 'documents.action.deleted',
    restored: 'documents.action.restored',
    permanently_deleted: 'documents.action.permanently_deleted',
  }
  return i18n.t(map[action] || 'common.unknown')
}

export function AuditLogSidebar({ logs, open, onClose }: AuditLogSidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 right-0 z-50 h-full w-80 bg-card border-l border-border/50 shadow-modal transform transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border/10">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold">{i18n.t('documents.activity_log')}</h3>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted spring-transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-57px)] p-4 space-y-2">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">{i18n.t('documents.activity_log_empty')}</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/10 spring-transition">
                <span className="text-micro font-bold text-muted-foreground uppercase shrink-0 mt-0.5 w-16 truncate">{actionLabel(log.action)}</span>
                <div className="min-w-0">
                  <p className="text-xs text-foreground leading-snug">{log.details}</p>
                  <p className="text-micro text-muted-foreground mt-0.5">{log.username} · {new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
