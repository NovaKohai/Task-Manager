import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ArrowRight, Info, AtSign, UserPlus, Clock, BarChart3, Shield, type LucideIcon } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { AnnouncementModal } from '@/components/notifications/AnnouncementModal'
import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import type { Notification } from '@/lib/types'

const ICON_MAP: Record<string, { bg: string; icon: LucideIcon }> = {
  announcement: { bg: 'bg-secondary/20 text-secondary', icon: Info },
  mention: { bg: 'bg-primary/20 text-primary', icon: AtSign },
  assignment: { bg: 'bg-surface-variant text-on-surface-variant', icon: UserPlus },
  deadline: { bg: 'bg-destructive/10 text-destructive', icon: Clock },
  digest: { bg: 'bg-primary/10 text-primary', icon: BarChart3 },
  security: { bg: 'bg-warning/10 text-warning', icon: Shield },
}

function notificationConfig(type: string): { bg: string; icon: LucideIcon } {
  if (type.includes('announcement')) return ICON_MAP.announcement
  if (type.includes('mention')) return ICON_MAP.mention
  if (type.includes('assignment') || type.includes('assigned')) return ICON_MAP.assignment
  if (type.includes('deadline') || type.includes('overdue')) return ICON_MAP.deadline
  if (type.includes('digest')) return ICON_MAP.digest
  if (type.includes('security') || type.includes('profile')) return ICON_MAP.security
  return { bg: 'bg-muted text-muted-foreground', icon: Bell }
}

function isAnnouncement(n: Notification) { return n.type.includes('announcement') }
function isDigest(n: Notification) { return n.type.includes('digest') }
function isSecurity(n: Notification) { return n.type.includes('security') }
function isMention(n: Notification) { return n.type === 'mention' }

type FilterType = 'all' | 'unread' | 'announcement' | 'task' | 'mention'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: i18n.t('all') },
  { key: 'unread', label: i18n.t('notifications.unread') },
  { key: 'announcement', label: i18n.t('notifications.announcement') },
  { key: 'task', label: i18n.t('notifications.tasks') },
  { key: 'mention', label: i18n.t('notifications.mention') },
]

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore()
  const { user } = useAuthStore()
  const [selectedAnn, setSelectedAnn] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => { if (user) fetchNotifications(user.id) }, [user, fetchNotifications])

  function handleMarkAll() { if (user) markAllRead(user.id) }

  const filtered = useMemo(() => notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'announcement') return isAnnouncement(n)
    if (filter === 'task') return !isAnnouncement(n) && !isDigest(n) && !isSecurity(n)
    if (filter === 'mention') return isMention(n)
    return true
  }), [notifications, filter])

  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications])

  function handleNotificationClick(n: Notification) {
    if (!n.read) markRead(n.id)
    if (n.taskId && !isAnnouncement(n)) {
      navigate(`/tasks/${n.taskId}`)
    } else {
      setSelectedAnn(n)
    }
  }

  return (
    <div className="space-y-5 page-bg">
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

      <div className="flex gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/10 w-fit animate-rise stagger-2">
        {FILTERS.map((f) => (
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
                const cfg = notificationConfig(n.type)
                const Icon = cfg.icon
                return (
                  <button type="button"
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 w-full text-left p-4 rounded-xl border spring-fast cursor-pointer group',
                      !n.read
                        ? 'bg-primary/[0.02] border-primary/20 hover:bg-primary/[0.04]'
                        : 'border-transparent hover:bg-muted/30'
                    )}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl spring-fast', cfg.bg)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm truncate', !n.read ? 'font-bold text-foreground' : 'text-foreground/80')}>{n.title}</p>
                        <span className="shrink-0 text-caption text-muted-foreground/50 font-mono">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className={cn('mt-0.5 text-sm line-clamp-2', !n.read ? 'text-foreground/70' : 'text-muted-foreground/70')}>{n.message}</p>
                      {n.taskId && !isAnnouncement(n) && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${n.taskId}`) }} className="mt-1.5 flex items-center gap-1 text-caption font-semibold text-primary hover:underline spring-fast">
                          {i18n.t('notifications.view_task')} <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      {isAnnouncement(n) && (
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

      <AnnouncementModal
        notification={selectedAnn}
        onClose={() => setSelectedAnn(null)}
        onMarkRead={(id) => markRead(id)}
      />
    </div>
  )
}
