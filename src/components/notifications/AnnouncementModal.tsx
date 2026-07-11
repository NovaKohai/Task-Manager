import { Bell, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import type { Notification } from '@/lib/types'

type AnnouncementModalProps = {
  notification: Notification | null
  onClose: () => void
  onMarkRead: (id: string) => void
}

export function AnnouncementModal({ notification, onClose, onMarkRead }: AnnouncementModalProps) {
  if (!notification) return null

  return (
    <div
      className={cn('modal-overlay', notification && 'active')}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ann-title"
    >
      <div className="modal-content p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 id="ann-title" className="text-base font-bold text-foreground">{notification.title}</h2>
              <p className="text-caption text-muted-foreground font-mono">{formatTime(notification.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 spring-fast text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="py-4 px-4 bg-muted/20 rounded-xl text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed border border-border/10">
          {notification.message}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="h-10 rounded-full text-xs font-semibold hover:bg-muted/40 spring-transition">
            {i18n.t('close')}
          </Button>
          {!notification.read && (
            <Button onClick={() => { onMarkRead(notification.id); onClose() }} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
              <CheckCheck className="h-3.5 w-3.5 ml-1" />
              {i18n.t('notifications.mark_as_read')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
