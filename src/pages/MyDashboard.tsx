import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, CheckCircle2, TrendingUp, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import { priorityBadge, getInitials, roleBadge, getDepartmentConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { formatFull } from '@/lib/format'

// formatDueLabel returns a relative-day label (today/tomorrow/days_left/days_overdue)
// rather than an absolute date — this is dashboard-specific and intentionally
// distinct from the shared `formatDate` helper in lib/format.ts.
function formatDueLabel(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  const diff = dt.getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return i18n.t('dashboard.days_overdue').replace('{days}', String(Math.abs(days)))
  if (days === 0) return i18n.t('dashboard.today')
  if (days === 1) return i18n.t('dashboard.tomorrow')
  return i18n.t('dashboard.days_left').replace('{days}', String(days))
}

export default function MyDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tasks, fetchTasks } = useTaskStore()

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const myTasks = useMemo(() => tasks.filter(t => t.assigneeId === user?.id), [tasks, user?.id])
  const openTasks = useMemo(() => myTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled'), [myTasks])
  const completedCount = useMemo(() => myTasks.filter(t => t.status === 'done').length, [myTasks])
  const upcomingDeadlines = useMemo(() => openTasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5), [openTasks])
  const recentActivity = useMemo(() => tasks.slice(0, 5), [tasks])

  return (
    <div className="space-y-5 dashboard-bg">
      {/* Greeting */}
      <div className="glass-panel animate-rise stagger-1">
        <div className="glass-panel-inner">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-lg text-primary font-semibold">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                {i18n.t('dashboard.welcome_back').replace('{name}', user?.name?.split(' ')[0] || 'User')}
                {user && <Badge variant={roleBadge[user.role]} className="rounded-full text-micro px-2 py-0">{i18n.t(`user.${user.role}`)}</Badge>}
                {user?.department && <Badge variant={getDepartmentConfig(user.department).variant} className="rounded-full text-micro px-2 py-0">{i18n.t(getDepartmentConfig(user.department).label)}</Badge>}
              </h1>
              <p className="text-xs text-muted-foreground">
                {i18n.t('dashboard.task_summary').replace('{open}', String(openTasks.length)).replace('{completed}', String(completedCount))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3 animate-rise stagger-2">
        <div className="double-bezel-outer hover:-translate-y-1 spring-transition">
          <div className="double-bezel-inner">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('dashboard.my_tasks')}</p>
              <ClipboardList className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-bold text-foreground">{myTasks.length}</p>
          </div>
        </div>
        <div className="double-bezel-outer hover:-translate-y-1 spring-transition">
          <div className="double-bezel-inner">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('dashboard.completed')}</p>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{completedCount}</p>
          </div>
        </div>
        <div className="double-bezel-outer hover:-translate-y-1 spring-transition">
          <div className="double-bezel-inner">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('dashboard.completion_rate')}</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0}%</p>
          </div>
        </div>
      </div>

      {/* Tasks & Deadlines */}
      <div className="grid gap-5 lg:grid-cols-2 animate-rise stagger-3">
        <div className="glass-panel">
          <div className="border-b border-border/10 px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">{i18n.t('dashboard.my_tasks')}</h2>
          </div>
          <div className="glass-panel-inner">
            <div className="space-y-1">
              {openTasks.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm font-semibold text-foreground">{i18n.t('dashboard.no_open_tasks')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i18n.t('dashboard.no_open_tasks_desc')}</p>
                </div>
              ) : (
                openTasks.map((t) => (
                  <button type="button" key={t.id} aria-label={t.title} className="flex cursor-pointer items-center justify-between w-full text-left p-3 rounded-xl border border-border/10 hover:border-primary/30 hover:bg-primary/5 spring-transition" onClick={() => navigate(`/tasks/${t.id}`)}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary spring-transition">{t.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={cn('text-caption font-semibold px-2 py-0.5 rounded-full', priorityBadge[t.priority].variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>{i18n.t(`priority.${t.priority}`)}</span>
                        <span className={cn('text-caption font-semibold px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground')}>{i18n.t(`task.status.${t.status}`)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="border-b border-border/10 px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">{i18n.t('dashboard.upcoming_deadlines')}</h2>
          </div>
          <div className="glass-panel-inner">
            <div className="space-y-1">
              {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Clock className="mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm font-semibold text-foreground">{i18n.t('dashboard.no_upcoming_deadlines')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i18n.t('dashboard.no_upcoming_deadlines_desc')}</p>
                </div>
              ) : (
                upcomingDeadlines.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date()
                  return (
                    <button type="button" key={t.id} className="flex cursor-pointer items-center justify-between w-full text-left p-3 rounded-xl border border-border/10 hover:border-primary/30 hover:bg-primary/5 spring-transition" onClick={() => navigate(`/tasks/${t.id}`)}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                        <p className="mt-0.5 text-caption text-muted-foreground font-mono">{t.code}</p>
                      </div>
                      <div className={cn('flex shrink-0 items-center gap-1 text-xs font-medium', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                        <Clock className="h-3 w-3" />
                        {formatDueLabel(t.dueDate)}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel animate-rise stagger-4">
        <div className="border-b border-border/10 px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">{i18n.t('dashboard.recent_activity')}</h2>
        </div>
        <div className="glass-panel-inner">
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm font-semibold text-foreground">{i18n.t('dashboard.no_recent_activity')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{i18n.t('dashboard.no_recent_activity_desc')}</p>
              </div>
            ) : (
              recentActivity.map((t) => (
                <button type="button" key={t.id} className="flex cursor-pointer items-center gap-3 w-full text-left p-3 rounded-xl border border-border/10 hover:border-primary/30 hover:bg-primary/5 spring-transition" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                    <p className="text-caption text-muted-foreground">{formatFull(t.updatedAt)}</p>
                  </div>
                  <span className={cn('text-caption font-semibold px-2.5 py-0.5 rounded-full shrink-0 bg-muted/30 text-muted-foreground')}>{i18n.t(`task.status.${t.status}`)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}

    </div>
  )
}
