import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, TrendingUp, TrendingDown, Minus, Calendar, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useReportStore } from '@/stores/reportStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { roleBadge, getDepartmentConfig } from '@/lib/constants'
import { formatDate, findUser } from '@/lib/format'
import type { ReportMetrics, User, Task } from '@/lib/types'
import PriorityAlerts from '@/components/dashboard/PriorityAlerts'

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let animationFrameId: number
    let startTime: number | null = null
    const startValue = 0
    const endValue = value

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const percentage = Math.min(progress / duration, 1)

      // Ease-out cubic: 1 - (1 - x)^3
      const easeOut = 1 - Math.pow(1 - percentage, 3)
      const currentValue = Math.floor(startValue + easeOut * (endValue - startValue))

      setCount(currentValue)

      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [value, duration])

  return <span>{count}%</span>
}

function buildTrendPath(trend: { date: string; completed: number }[]): { linePath: string; areaPath: string; points: { x: number; y: number; value: number }[] } {
  const W = 500
  const H = 150
  const padY = 20
  const max = Math.max(...trend.map(d => d.completed), 1)
  const n = trend.length
  if (n === 0) return { linePath: '', areaPath: '', points: [] }
  const stepX = n > 1 ? W / (n - 1) : 0
  const points = trend.map((d, i) => ({
    x: i * stepX,
    y: H - padY - (d.completed / max) * (H - padY * 2),
    value: d.completed,
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`
  return { linePath, areaPath, points }
}

function getWeekOverWeekChange(trend: { date: string; completed: number }[]): { pct: number; direction: 'up' | 'down' | 'flat' } {
  const firstHalf = trend.slice(0, Math.ceil(trend.length / 2)).reduce((sum, d) => sum + d.completed, 0)
  const secondHalf = trend.slice(Math.ceil(trend.length / 2)).reduce((sum, d) => sum + d.completed, 0)
  if (firstHalf === 0 && secondHalf === 0) return { pct: 0, direction: 'flat' }
  if (firstHalf === 0) return { pct: 100, direction: 'up' }
  const diff = ((secondHalf - firstHalf) / firstHalf) * 100
  return { pct: Math.abs(Math.round(diff)), direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }
}

function getMotivationalText(metrics: ReportMetrics | null): string {
  if (!metrics || metrics.totalTasks === 0) return i18n.t('dashboard.motivational_no_data')
  const change = getWeekOverWeekChange(metrics.trend)
  if (change.direction === 'up') return i18n.t('dashboard.motivational_positive').replace('{value}', String(change.pct))
  if (change.direction === 'down') return i18n.t('dashboard.motivational_down').replace('{value}', String(change.pct))
  return i18n.t('dashboard.motivational_neutral').replace('{completed}', String(metrics.completedTasks))
}

// Sub-render function: Performance Trend Sparkline
function renderTrendCard(completionRate: number, trend: { date: string; completed: number }[]) {
  const { linePath, areaPath, points } = buildTrendPath(trend)
  const change = getWeekOverWeekChange(trend)
  const trendLabelPct = change.pct
  const trendIcon = change.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : change.direction === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />
  const trendColor = change.direction === 'up' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : change.direction === 'down' ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-muted-foreground bg-muted/40 border-border'
  const trendText = change.direction === 'up'
    ? i18n.t('manager.trend_up').replace('{value}', String(trendLabelPct))
    : change.direction === 'down'
      ? i18n.t('manager.trend_down').replace('{value}', String(trendLabelPct))
      : i18n.t('manager.trend_flat')

  return (
    <div className="double-bezel-outer md:col-span-8 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.trend')}</h3>
            <p className="text-2xl font-black text-foreground mt-1">
              <AnimatedCounter value={completionRate} /> {i18n.t('report.completion_rate')}
            </p>
          </div>
          <span className={cn('text-caption px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1', trendColor)}>
            <span aria-hidden="true">{trendIcon}</span>
            <span>{trendText}</span>
          </span>
        </div>
        
        {/* SVG sparkline line graph — wired to real trend data */}
        <div className="h-32 w-full mt-4 flex items-end overflow-hidden">
          {points.length > 0 ? (
            <svg
              className="w-full h-full animate-reveal-chart"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              aria-label={`${i18n.t('report.trend')}: ${completionRate}%`}
              role="img"
            >
              <defs>
                <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#trend-grad)" />
              <path d={linePath} className="animate-draw-line" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" opacity={p.value > 0 ? 1 : 0} />
              ))}
            </svg>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-caption text-muted-foreground/40">
              {i18n.t('manager.trend_no_data')}
            </div>
          )}
        </div>
        <div className="flex justify-between text-micro text-muted-foreground/60 font-medium mt-2 px-1">
          {trend.map((d) => (
            <span key={d.date}>{i18n.t(`manager.day_${d.date.toLowerCase()}`)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Sub-render function: Quick Stats grid
interface StatsData {
  totalTasks: number
  completedTasks: number
  completionRate: number
  overdueTasks: number
}

function renderStatsGrid(stats: StatsData, metrics: ReportMetrics | null) {
  const motivational = getMotivationalText(metrics)
  return (
    <div className="double-bezel-outer md:col-span-4 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between h-full">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">{i18n.t('filter')}</h3>
          <div className="grid grid-cols-2 gap-3.5 mt-2">
            <div className="bg-muted/30 p-3 rounded-2xl border border-border/10">
              <p className="text-micro uppercase font-semibold text-muted-foreground/60 tracking-wider">{i18n.t('dashboard.open_tasks')}</p>
              <p className="text-xl font-bold text-foreground mt-1">{stats.totalTasks}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-2xl border border-border/10">
              <p className="text-micro uppercase font-semibold text-muted-foreground/60 tracking-wider">{i18n.t('dashboard.completed')}</p>
              <p className="text-xl font-bold text-primary mt-1">{stats.completedTasks}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-2xl border border-border/10">
              <p className="text-micro uppercase font-semibold text-muted-foreground/60 tracking-wider">{i18n.t('manager.rate')}</p>
              <p className="text-xl font-bold text-foreground mt-1">{stats.completionRate}%</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-2xl border border-border/10">
              <p className="text-micro uppercase font-semibold text-muted-foreground/60 tracking-wider">{i18n.t('report.overdue')}</p>
              <p className={cn("text-xl font-bold mt-1", stats.overdueTasks > 0 ? "text-destructive" : "text-foreground")}>
                {stats.overdueTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2.5">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <p className="text-micro text-muted-foreground/90 font-medium leading-normal">
            {motivational}
          </p>
        </div>
      </div>
    </div>
  )
}

// Sub-render function: Recent Active Tasks List
function renderRecentTasks(
  recentTasks: { id: string; code: string; title: string; assigneeId: string | null; priority: any; status: any; updatedAt: string; dueDate: string | null }[],
  users: User[],
  navigate: (path: string) => void
) {
  return (
    <div className="double-bezel-outer lg:col-span-7 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('nav.tasks')}</h3>
            <p className="text-caption text-muted-foreground/60 mt-1">{i18n.t('dashboard.active_tasks_subtitle')}</p>
          </div>
          {recentTasks.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="h-7 text-xs rounded-full px-4 hover:bg-muted/40 spring-transition">
              {i18n.t('dashboard.view_all')}
              <ArrowRight className="ml-1 h-3 w-3 shrink-0" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">{i18n.t('task.no_tasks')}</p>
            </div>
          ) : (
            recentTasks.map((t) => (
              <button type="button"
                key={t.id}
                onClick={() => navigate(`/tasks/${t.id}`)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/10 hover:border-border/30 cursor-pointer spring-transition w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    t.priority === 'critical' || t.priority === 'high' ? 'bg-destructive' : 'bg-primary'
                  )} />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">{t.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-micro font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                        t.priority === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      )}>
                        {i18n.t(`priority.${t.priority}`)}
                      </span>
                      {(() => { const assigneeUser = findUser(users, t.assigneeId); return assigneeUser ? <span className="inline-flex items-center gap-1"><span className="text-caption text-muted-foreground">{assigneeUser.name}</span><Badge variant={roleBadge[assigneeUser.role]} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(`user.${assigneeUser.role}`)}</Badge>{assigneeUser.department ? <Badge variant={getDepartmentConfig(assigneeUser.department).variant} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(getDepartmentConfig(assigneeUser.department).label)}</Badge> : null}</span> : <span className="text-caption text-muted-foreground">—</span> })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-caption text-muted-foreground font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDate(t.dueDate)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-render function: Team Directory Widget
function renderTeamPerformance(topPerformers: { userId: string; name: string; completed: number }[], users: User[]) {
  const ranked = topPerformers.slice(0, 3)
  return (
    <div className="double-bezel-outer lg:col-span-5 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-6">{i18n.t('report.team_performance')}</h3>
          <div className="space-y-4">
            {ranked.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{i18n.t('manager.trend_no_data')}</p>
              </div>
            ) : ranked.map((member, idx) => {
              const userRecord = users.find(u => u.id === member.userId)
              return (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5 flex-wrap">
                      {member.name}
                      {userRecord?.department ? <Badge variant={getDepartmentConfig(userRecord.department).variant} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(getDepartmentConfig(userRecord.department).label)}</Badge> : null}
                    </h4>
                    <p className="text-caption text-muted-foreground truncate">
                      {userRecord ? i18n.t(`user.${userRecord.role}`) : '—'}
                      <span className="font-semibold text-foreground"> · {i18n.t('reports.completed_count').replace('{count}', String(member.completed))}</span>
                    </p>
                  </div>
                  <span className={cn(
                    'text-micro font-semibold px-2 py-0.5 rounded-full border',
                    idx === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                  )}>
                    #{idx + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 flex justify-between items-center text-caption text-muted-foreground font-medium">
          <span>{i18n.t('dashboard.workspace_members').replace('{count}', String(users.length))}</span>
          <span className="text-primary font-bold">{i18n.t('dashboard.active_status')}</span>
        </div>
      </div>
    </div>
  )
}

// Sub-render function: Workload Heatmap Widget
function renderWorkloadHeatmap(tasks: Task[], users: User[]) {
  const developers = users.filter(u => u.role === 'developer' || u.role === 'manager')
  return (
    <div className="double-bezel-outer lg:col-span-12 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-6 flex items-center gap-2">
            <span>📊</span>
            {i18n.t('manager.workload_heatmap')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {developers.map(dev => {
              const activeTasks = tasks.filter(t => t.assigneeId === dev.id && t.status !== 'done' && t.status !== 'cancelled')
              const totalHours = activeTasks.reduce((sum, t) => sum + (t.estHours || 0), 0)
              
              let statusLabel = i18n.t('manager.workload.available')
              let statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              let barColor = 'bg-emerald-500'
              
              if (totalHours > 40) {
                statusLabel = i18n.t('manager.workload.overloaded')
                statusColor = 'text-destructive bg-destructive/10 border-destructive/20'
                barColor = 'bg-red-500'
              } else if (totalHours >= 20) {
                statusLabel = i18n.t('manager.workload.full')
                statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                barColor = 'bg-amber-500'
              }

              const pct = Math.min((totalHours / 40) * 100, 100)

              return (
                <div key={dev.id} className="p-3 bg-muted/10 border border-border/10 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold flex items-center gap-1.5 flex-wrap">
                      <span>{dev.name}</span>
                      {dev.department && <Badge variant={getDepartmentConfig(dev.department).variant} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(getDepartmentConfig(dev.department).label)}</Badge>}
                    </div>
                    <span className={cn('text-micro font-semibold px-2 py-0.5 rounded-full border', statusColor)}>
                      {statusLabel} ({totalHours}h)
                    </span>
                  </div>
                  
                  <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div className={cn('h-full rounded-full spring-transition', barColor)} style={{ width: `${pct}%` }} />
                  </div>
                  
                  <div className="flex items-center justify-between text-micro text-muted-foreground">
                    <span>{i18n.t('manager.workload.active_tasks').replace('{count}', String(activeTasks.length))}</span>
                    <span>{i18n.t('manager.workload.allocated_hours').replace('{allocated}', String(totalHours)).replace('{total}', '40')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { metrics, fetchMetrics } = useReportStore()
  const { users, fetchUsers } = useUserStore()

  useEffect(() => {
    fetchTasks()
    fetchMetrics()
    fetchUsers()
  }, [fetchTasks, fetchMetrics, fetchUsers])

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3),
    [tasks]
  )
  const stats = metrics || { totalTasks: 0, completedTasks: 0, completionRate: 0, overdueTasks: 0, trend: [], topPerformers: [] }

  const hour = new Date().getHours()
  let greetingKey = 'greeting.evening'
  if (hour < 12) greetingKey = 'greeting.morning'
  else if (hour < 18) greetingKey = 'greeting.afternoon'

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto dashboard-bg">
      {/* Dashboard Greeting Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40 animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {i18n.t(greetingKey)}, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-muted-foreground/90 mt-1">{i18n.t('dashboard.team_overview')}</p>
        </div>

        <Button onClick={() => navigate('/tasks/create')} className="group flex items-center justify-between gap-4 bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-medium text-xs px-5 py-2.5 rounded-full shadow-lg shadow-primary/10 active:scale-[0.98] spring-transition h-10 border-none">
          <span>{i18n.t('task.create')}</span>
          <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center group-hover:rotate-45 spring-transition">
            <Plus className="h-3 w-3 shrink-0" />
          </div>
        </Button>
      </div>

      <PriorityAlerts />

      {/* Bento Grid Top Section: Trend Chart & Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-rise stagger-2">
        {renderTrendCard(stats.completionRate, stats.trend || [])}
        {renderStatsGrid(stats, metrics)}
      </div>

      {/* Bento Grid Lower Section: Recent Tasks & Team Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-rise stagger-3">
        {renderRecentTasks(recentTasks, users, navigate)}
        {renderTeamPerformance(stats.topPerformers || [], users)}
      </div>

      {/* Bento Grid Heatmap Section */}
      <div className="grid grid-cols-1 gap-6 animate-rise stagger-4">
        {renderWorkloadHeatmap(tasks, users)}
      </div>
    </div>
  )
}
