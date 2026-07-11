import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useReportStore } from '@/stores/reportStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'

function getUserName(users: { id: string; name: string }[], id: string | null): string {
  if (!id) return '—'
  return users.find(u => u.id === id)?.name || '—'
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

// Sub-render function: Performance Trend Sparkline
function renderTrendCard(completionRate: number) {
  return (
    <div className="double-bezel-outer md:col-span-8 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.trend')}</h3>
            <p className="text-2xl font-black text-foreground mt-1">{completionRate}% {i18n.t('report.completion_rate')}</p>
          </div>
          <span className="text-caption bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
            +12% this week
          </span>
        </div>
        
        {/* Custom SVG sparkline line graph */}
        <div className="h-32 w-full mt-4 flex items-end">
          <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0,110 Q 50,80 100,130 T 200,90 T 300,60 T 400,100 T 500,30 L 500,150 L 0,150 Z" fill="url(#trend-grad)" />
            <path d="M 0,110 Q 50,80 100,130 T 200,90 T 300,60 T 400,100 T 500,30" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="40" x2="500" y2="40" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
          </svg>
        </div>
          <div className="flex justify-between text-micro text-muted-foreground/60 font-medium mt-2 px-1">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
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

function renderStatsGrid(stats: StatsData) {
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
              <p className="text-micro uppercase font-semibold text-muted-foreground/60 tracking-wider">Rate</p>
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
          <p className="text-micro text-muted-foreground/80 font-medium leading-normal">
            You completed 15% more tasks this sprint. Keep it up!
          </p>
        </div>
      </div>
    </div>
  )
}

// Sub-render function: Recent Active Tasks List
function renderRecentTasks(
  recentTasks: any[],
  users: any[],
  navigate: (path: string) => void
) {
  return (
    <div className="double-bezel-outer lg:col-span-7 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('nav.tasks')}</h3>
            <p className="text-caption text-muted-foreground/60 mt-1">Active items requiring your attention.</p>
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
                      <span className="text-caption text-muted-foreground">{getUserName(users, t.assigneeId)}</span>
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
function renderTeamPerformance(users: any[]) {
  const activeMembers = users.slice(0, 3)
  return (
    <div className="double-bezel-outer lg:col-span-5 hover:translate-y-[-2px] spring-transition">
      <div className="double-bezel-inner flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-6">{i18n.t('report.team_performance')}</h3>
          <div className="space-y-4">
            {activeMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">{member.name}</h4>
                  <p className="text-caption text-muted-foreground truncate">{i18n.t(`user.${member.role}`)}</p>
                </div>
                <span className={cn(
                  "text-micro font-semibold px-2 py-0.5 rounded-full border",
                  member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                )}>
                  {member.status === 'active' ? i18n.t('users.active') : i18n.t('users.inactive')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/10 flex justify-between items-center text-caption text-muted-foreground font-medium">
          <span>{users.length} Workspace Members</span>
          <span className="text-primary font-bold">Active Status</span>
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

  const recentTasks = tasks.slice(0, 3)
  const stats = metrics || { totalTasks: 0, completedTasks: 0, completionRate: 0, overdueTasks: 0 }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto dashboard-bg">
      {/* Dashboard Greeting Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40 animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {i18n.t('greeting.morning')}, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-muted-foreground/80 mt-1">Here is a quick overview of your team's workspace.</p>
        </div>

        <Button onClick={() => navigate('/tasks/create')} className="group flex items-center justify-between gap-4 bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-medium text-xs px-5 py-2.5 rounded-full shadow-lg shadow-primary/10 active:scale-[0.98] spring-transition h-10 border-none">
          <span>{i18n.t('task.create')}</span>
          <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center group-hover:rotate-45 spring-transition">
            <Plus className="h-3 w-3 shrink-0" />
          </div>
        </Button>
      </div>

      {/* Bento Grid Top Section: Trend Chart & Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-rise stagger-2">
        {renderTrendCard(stats.completionRate)}
        {renderStatsGrid(stats)}
      </div>

      {/* Bento Grid Lower Section: Recent Tasks & Team Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-rise stagger-3">
        {renderRecentTasks(recentTasks, users, navigate)}
        {renderTeamPerformance(users)}
      </div>
    </div>
  )
}
