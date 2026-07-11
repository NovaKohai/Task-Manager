import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ArrowRight, Info, X } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import type { Notification } from '@/lib/types'

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return i18n.t('notifications.just_now')
  if (mins < 60) return i18n.t('notifications.min_ago').replace('{m}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return i18n.t('notifications.hour_ago').replace('{h}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 7) return i18n.t('notifications.day_ago').replace('{d}', String(days))
  return d.toLocaleDateString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')
}

function getNotificationIcon(type: string): { bg: string; icon: string } {
  if (type.includes('announcement')) return { bg: 'bg-secondary/20 text-secondary', icon: 'info' }
  if (type.includes('mention')) return { bg: 'bg-primary/20 text-primary', icon: 'at-sign' }
  if (type.includes('assignment') || type.includes('assigned')) return { bg: 'bg-surface-variant text-on-surface-variant', icon: 'user-plus' }
  if (type.includes('deadline') || type.includes('overdue')) return { bg: 'bg-destructive/10 text-destructive', icon: 'clock' }
  if (type.includes('digest')) return { bg: 'bg-primary/10 text-primary', icon: 'bar-chart' }
  if (type.includes('security') || type.includes('profile')) return { bg: 'bg-warning/10 text-warning', icon: 'shield' }
  return { bg: 'bg-muted text-muted-foreground', icon: 'bell' }
}

type FilterType = 'all' | 'unread' | 'announcement' | 'task'

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore()
  const { user } = useAuthStore()
  const [selectedAnn, setSelectedAnn] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => { if (user) fetchNotifications(user.id) }, [user, fetchNotifications])

  async function handleMarkAll() { if (user) await markAllRead(user.id) }

  const filtered = useMemo(() => notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'announcement') return n.type.includes('announcement')
    if (filter === 'task') return !n.type.includes('announcement') && !n.type.includes('digest') && !n.type.includes('security')
    return true
  }), [notifications, filter])

  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications])

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: i18n.t('all') },
    { key: 'unread', label: i18n.t('notifications.unread') },
    { key: 'announcement', label: i18n.t('notifications.announcement') },
    { key: 'task', label: i18n.t('notifications.tasks') },
  ]

  return (
    <div className="space-y-5 page-bg">
      {/* Header */}
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('notifications.title')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('notifications.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-8 rounded-full text-xs font-semibold hover:bg-primary/10 hover:text-primary spring-transition border border-border/20">
          <CheckCheck className="h-3.5 w-3.5 ml-1" />
          {i18n.t('notifications.mark_read')}
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/10 w-fit animate-rise stagger-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'pill-tab spring-fast',
              filter === f.key ? 'pill-tab-active' : 'pill-tab-inactive'
            )}
          >
            {f.label}
            {f.key === 'unread' && hasUnread && (
              <span className="neon-dot inline-block mr-1.5 align-middle" style={{ width: 6, height: 6 }} />
            )}
          </button>
        ))}
      </div>

      {/* Notification Feed */}
      <div className="glass-panel flex-1 animate-rise stagger-3">
        <div className="glass-panel-inner" style={{ margin: 0, borderRadius: 0 }}>
          <div className="max-h-[65vh] overflow-y-auto space-y-1 p-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-semibold">{i18n.t('notifications.empty')}</p>
              </div>
            ) : (
              filtered.map((n) => {
                const icon = getNotificationIcon(n.type)
                return (
                  <button type="button"
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 w-full text-left p-4 rounded-xl border spring-fast cursor-pointer group',
                      !n.read
                        ? 'bg-primary/[0.02] border-primary/20 hover:bg-primary/[0.04]'
                        : 'border-transparent hover:bg-muted/30'
                    )}
                    onClick={async () => {
                      if (n.taskId && !n.type.includes('announcement')) {
                        navigate(`/tasks/${n.taskId}`)
                      } else {
                        setSelectedAnn(n)
                      }
                      if (!n.read) await markRead(n.id)
                    }}
                  >
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl spring-fast', icon.bg)}>
                      <Info className={cn('h-4 w-4', icon.icon.includes('text-') ? '' : '')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm truncate', !n.read ? 'font-bold text-foreground' : 'text-foreground/80')}>{n.title}</p>
                        <span className="shrink-0 text-caption text-muted-foreground/50 font-mono">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className={cn('mt-0.5 text-sm line-clamp-2', !n.read ? 'text-foreground/70' : 'text-muted-foreground/70')}>{n.message}</p>
                      {n.taskId && !n.type.includes('announcement') && (
                        <div role="link" tabIndex={0} className="mt-1.5 flex items-center gap-1 text-caption font-semibold text-primary hover:underline spring-fast cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${n.taskId}`) }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); navigate(`/tasks/${n.taskId}`) }}}>
                          {i18n.t('notifications.view_task')} <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                      {n.type.includes('announcement') && (
                        <div className="mt-1.5">
                          <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                            {i18n.t('notifications.admin_alert_badge')}
                          </span>
                        </div>
                      )}
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 neon-dot shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Animated Announcement Modal */}
      <div
        className={cn('modal-overlay', selectedAnn && 'active')}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnn(null) }}
        onKeyDown={(e) => { if (e.key === 'Escape') setSelectedAnn(null) }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-content p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{selectedAnn?.title}</h2>
                <p className="text-caption text-muted-foreground font-mono">{selectedAnn && formatTime(selectedAnn.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAnn(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 spring-fast text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="py-4 px-4 bg-muted/20 rounded-xl text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed border border-border/10">
            {selectedAnn?.message}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setSelectedAnn(null)} className="h-10 rounded-full text-xs font-semibold hover:bg-muted/40 spring-transition">
              {i18n.t('close')}
            </Button>
            {selectedAnn && selectedAnn.read === false && (
              <Button onClick={async () => { if (selectedAnn) { await markRead(selectedAnn.id); setSelectedAnn(null) } }} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
                <CheckCheck className="h-3.5 w-3.5 ml-1" />
                {i18n.t('notifications.mark_as_read')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
