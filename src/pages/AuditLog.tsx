import { useEffect, useState, useMemo } from 'react'
import { Download, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import type { AuditAction, AuditEntry } from '@/lib/types'

function actionLabel(action: AuditAction): string {
  return i18n.t(`audit_log.action_${action}`)
}

const actionVariants: Record<AuditAction, 'default' | 'success' | 'danger' | 'warning'> = {
  login: 'success',
  logout: 'default',
  login_failed: 'danger',
  task_created: 'success',
  task_updated: 'default',
  task_deleted: 'danger',
  user_created: 'success',
  user_updated: 'default',
  user_deleted: 'danger',
  user_approved: 'success',
  user_rejected: 'danger',
  settings_updated: 'default',
  settings_reset: 'warning',
  audit_log_cleared: 'danger',
}

const allActions: AuditAction[] = ['login', 'logout', 'login_failed', 'task_created', 'task_updated', 'task_deleted', 'user_created', 'user_updated', 'user_deleted', 'user_approved', 'user_rejected', 'settings_updated', 'settings_reset', 'audit_log_cleared']

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  useEffect(() => {
    const results = db.getAuditLog({
      action: actionFilter !== 'all' ? actionFilter : undefined,
      search: search || undefined,
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
    setEntries(results)
  }, [actionFilter, search, page])

  const totalCount = useMemo(() => db.auditEntries.length, [])

  function formatDate(iso: string) {
    const d = new Date(iso)
    const locale = i18n.lang === 'ar' ? 'ar-SA' : 'en-US'
    return d.toLocaleString(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function handleExportCSV() {
    const all = db.getAuditLog()
    const headers = [i18n.t('audit_log.date'), i18n.t('audit_log.action'), i18n.t('audit_log.user'), i18n.t('audit_log.details')]
    const rows = all.map(e => [
      new Date(e.timestamp).toISOString(),
      actionLabel(e.action),
      e.username,
      `"${e.details.replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <div className="space-y-5 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('audit_log.title')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('audit_log.subtitle')}</p>
        </div>
        <Button onClick={handleExportCSV} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
          <Download className="h-4 w-4" />
          {i18n.t('audit_log.export_csv')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center animate-rise stagger-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={i18n.t('audit_log.search')}
            className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition pl-10 rtl:pl-4 rtl:pr-10"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground spring-transition">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select aria-label={i18n.t('audit_log.filter_action')} value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
          <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition min-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{i18n.t('audit_log.all_actions')}</SelectItem>
            {allActions.map(action => (
              <SelectItem key={action} value={action}>{actionLabel(action)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-caption text-muted-foreground/60 whitespace-nowrap">
          {i18n.t('audit_log.entries').replace('{count}', String(totalCount))}
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel animate-rise stagger-3">
        <div className="glass-panel-inner p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                <Search className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-base font-semibold text-foreground">{i18n.t('audit_log.empty')}</p>
              <p className="text-sm text-muted-foreground mt-1">{i18n.t('audit_log.empty_desc')}</p>
            </div>
          ) : (
            <>
              <Table>
                <caption className="sr-only">{i18n.t('audit_log.title')}</caption>
                <TableHeader>
                  <TableRow>
                    <th scope="col" className="text-xs font-medium h-10 px-2 text-left align-middle text-muted-foreground sr-only">{i18n.t('audit_log.date')}</th>
                    <TableHead className="text-xs font-medium">{i18n.t('audit_log.date')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('audit_log.action')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('audit_log.user')}</TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('audit_log.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/20 spring-fast">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={actionVariants[entry.action] || 'default'}
                          className="rounded-full text-caption px-2.5 py-0"
                        >
                          {actionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{entry.username || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={entry.details}>
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
                  <span className="text-caption text-muted-foreground/60">
                    {i18n.t('audit_log.page').replace('{page}', String(page + 1)).replace('{total}', String(Math.ceil(totalCount / PAGE_SIZE)))}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="h-8 rounded-full text-xs spring-transition">
                      {i18n.t('audit_log.previous')}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE_SIZE >= totalCount}
                      onClick={() => setPage(p => p + 1)}
                      className="h-8 rounded-full text-xs spring-transition">
                      {i18n.t('audit_log.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
