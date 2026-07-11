import { useEffect, useState } from 'react'
import { Download, CheckCircle2, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { useReportStore } from '@/stores/reportStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import type { TaskStatus } from '@/lib/types'

const periodKeys = ['reports.period_7d', 'reports.period_30d', 'reports.period_quarter', 'reports.period_all'] as const

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-slate-400', in_progress: 'bg-blue-500', done: 'bg-green-500', cancelled: 'bg-red-400',
}

export default function Reports() {
  const [periodIdx, setPeriodIdx] = useState(1)
  const { metrics, isLoading, fetchMetrics } = useReportStore()
  const { fetchUsers } = useUserStore()

  useEffect(() => {
    try {
      fetchMetrics(i18n.t(periodKeys[periodIdx]))
    } catch (e) {
      console.error('fetchMetrics failed', e)
    }
    fetchUsers()
  }, [periodIdx, fetchMetrics, fetchUsers])

  const m = metrics || {
    totalTasks: 0, completedTasks: 0, completionRate: 0, avgResolutionDays: 0, overdueTasks: 0,
    byStatus: [], byPriority: [], topPerformers: [], trend: [],
  }

  const maxTrend = Math.max(...m.trend.map(d => d.completed), 1)

  return (
    <div className="space-y-5 page-bg">
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('report.title')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={async () => { const period = i18n.t(periodKeys[periodIdx]); const { exportReportXLSX } = await import('@/lib/export'); exportReportXLSX(m, period) }} className="h-8 rounded-full spring-transition text-xs font-semibold px-4">
            <Download className="h-3.5 w-3.5" />XLSX
          </Button>
          <Button variant="secondary" size="sm" onClick={async () => { const period = i18n.t(periodKeys[periodIdx]); const { exportReportPDF } = await import('@/lib/export'); exportReportPDF(m, period) }} className="h-8 rounded-full spring-transition text-xs font-semibold px-4">
            <Download className="h-3.5 w-3.5" />PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/10 w-fit animate-rise stagger-2">
        {periodKeys.map((k, i) => {
          const label = i18n.t(k)
          return (
          <button key={k} onClick={() => setPeriodIdx(i)}
            className={cn('pill-tab spring-fast', periodIdx === i ? 'pill-tab-active' : 'pill-tab-inactive')}>
            {label}
          </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 animate-rise stagger-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-rise stagger-3">
            <div className="glass-panel">
              <div className="glass-panel-inner space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.completed')}</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{m.completedTasks}</p>
                <p className="text-xs text-muted-foreground">{i18n.t('reports.out_of').replace('{count}', String(m.totalTasks))}</p>
              </div>
            </div>
            <div className="glass-panel">
              <div className="glass-panel-inner space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.completion_rate')}</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{m.completionRate}%</p>
              </div>
            </div>
            <div className="glass-panel">
              <div className="glass-panel-inner space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.avg_resolution')}</p>
                  <Clock className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <p className="text-2xl font-bold text-foreground">{m.avgResolutionDays}d</p>
              </div>
            </div>
            <div className="glass-panel">
              <div className="glass-panel-inner space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.overdue')}</p>
                  <AlertTriangle className={cn('h-4 w-4', m.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground/60')} />
                </div>
                <p className="text-2xl font-bold text-foreground">{m.overdueTasks}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 animate-rise stagger-4">
            <div className="glass-panel">
              <div className="glass-panel-inner space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.trend')}</h2>
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {m.trend.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-full bg-primary spring-transition" style={{ height: `${(d.completed / maxTrend) * 100}%`, minHeight: 4 }} />
                      <span className="text-caption text-muted-foreground font-mono">{d.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <div className="glass-panel-inner space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.distribution')}</h2>
                <div className="space-y-3">
                  {m.byStatus.map((s) => (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold">{i18n.t(`task.status.${s.status}`)}</span>
                        <span className="text-muted-foreground font-mono text-xs">{s.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn('h-full rounded-full transition-all', statusColors[s.status])} style={{ width: `${m.totalTasks > 0 ? (s.count / m.totalTasks) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel animate-rise stagger-5">
            <div className="glass-panel-inner space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.performers')}</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                {m.topPerformers.map((p, i) => (
                  <div key={p.userId} className="flex flex-1 items-center gap-3 rounded-xl border border-border/10 p-4 hover:border-border/30 spring-fast bg-muted/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">{i + 1}</div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-semibold">{i18n.t('reports.completed_count').replace('{count}', String(p.completed))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel animate-rise stagger-5">
            <div className="glass-panel-inner !p-0">
              <div className="px-5 py-4 border-b border-border/10">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('report.team_performance')}</h2>
              </div>
              <Table>
                <caption className="sr-only">{i18n.t('report.team_performance')}</caption>
                <TableHeader>
                  <TableRow>
                    <th scope="col" className="sr-only">{i18n.t('report.member')}</th>
                    <TableHead className="text-xs font-medium">{i18n.t('report.member')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('dashboard.completed')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('report.in_progress')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('report.overdue')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('report.completion_rate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.topPerformers.map((p) => (
                    <TableRow key={p.userId} className="hover:bg-muted/20 spring-fast">
                      <TableCell className="text-sm font-bold text-foreground">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.completed}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
