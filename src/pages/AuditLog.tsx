import { useState, useMemo } from 'react'
import { Download, Search, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Users, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { formatFull } from '@/lib/format'
import type { AuditAction } from '@/lib/types'

type SortKey = 'date' | 'action' | 'user'
type SortDir = 'asc' | 'desc'

const DATE_PRESETS: { label: string; value: number }[] = [
  { label: 'audit_log.date_all', value: 0 },
  { label: 'audit_log.date_24h', value: 86400000 },
  { label: 'audit_log.date_7d', value: 7 * 86400000 },
  { label: 'audit_log.date_30d', value: 30 * 86400000 },
  { label: 'audit_log.date_90d', value: 90 * 86400000 },
]

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
  user_activated: 'success',
  user_deactivated: 'danger',
  password_changed: 'warning',
  profile_updated: 'default',
  broadcast_sent: 'default',
  settings_updated: 'default',
  settings_reset: 'warning',
  audit_log_cleared: 'danger',
}

const allActions: AuditAction[] = [
  'login', 'logout', 'login_failed',
  'task_created', 'task_updated', 'task_deleted',
  'user_created', 'user_updated', 'user_deleted',
  'user_approved', 'user_rejected',
  'user_activated', 'user_deactivated',
  'password_changed', 'profile_updated', 'broadcast_sent',
  'settings_updated', 'settings_reset', 'audit_log_cleared',
]

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-30" />
  return dir === 'asc'
    ? <ArrowUp className="h-3 w-3 inline ml-1" />
    : <ArrowDown className="h-3 w-3 inline ml-1" />
}

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [dateRange, setDateRange] = useState(0)
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)
  const PAGE_SIZE = 25

  const allEntries = useMemo(() => {
    let result = [...db.auditEntries]

    if (actionFilter !== 'all') {
      result = result.filter(e => e.action === actionFilter)
    }

    if (userFilter) {
      result = result.filter(e => e.userId === userFilter)
    }

    if (dateRange > 0) {
      const cutoff = Date.now() - dateRange
      result = result.filter(e => new Date(e.timestamp).getTime() > cutoff)
    }

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase()
      result = result.filter(e =>
        e.details.toLowerCase().includes(s) ||
        e.username.toLowerCase().includes(s)
      )
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'date':
          cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'action':
          cmp = a.action.localeCompare(b.action)
          break
        case 'user':
          cmp = a.username.localeCompare(b.username)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [actionFilter, userFilter, dateRange, debouncedSearch, sortKey, sortDir])

  const totalCount = allEntries.length
  const entries = allEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const userFilterName = useMemo(() => {
    if (!userFilter) return null
    const u = db.getUsers().find(u => u.id === userFilter)
    return u ? u.username || u.name : null
  }, [userFilter])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  function handleExportCSV() {
    setExporting(true)
    setTimeout(() => {
      try {
        const headers = [i18n.t('audit_log.date'), i18n.t('audit_log.action'), i18n.t('audit_log.user'), i18n.t('audit_log.details')]
        const rows = allEntries.map(e => [
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
      } finally {
        setExporting(false)
      }
    }, 50)
  }

  function handleClearLog() {
    setShowClearConfirm(true)
  }

  function executeClearLog() {
    const user = useAuthStore.getState().user
    db.clearAuditLog(user?.id, user?.username)
    setPage(0)
    setShowClearConfirm(false)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <div className="space-y-8 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('audit_log.title')}</h1>
          <p className="text-xs text-muted-foreground/90 mt-1">{i18n.t('audit_log.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClearLog} variant="danger" className="h-10 rounded-full text-xs font-semibold spring-transition active:scale-[0.97] shadow-lg shadow-destructive/10">
            <Trash2 className="h-4 w-4" />
            {i18n.t('audit_log.clear')}
          </Button>
          <Button onClick={handleExportCSV} disabled={exporting} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20 active:scale-[0.97]">
            <Download className="h-4 w-4" />
            {exporting ? i18n.t('audit_log.exporting') : i18n.t('audit_log.export_csv')}
          </Button>
        </div>
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

      {/* Date range + user filter */}
      <div className="flex flex-wrap gap-2 items-center animate-rise stagger-2">
        <span className="text-caption font-semibold text-muted-foreground mr-1">{i18n.t('audit_log.period')}:</span>
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => { setDateRange(p.value); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold spring-transition border ${
              dateRange === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background/50 text-muted-foreground border-border/40 hover:bg-muted/30'
            }`}
          >
            {i18n.t(p.label)}
          </button>
        ))}
        {userFilterName && (
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-secondary/20 text-secondary text-caption font-semibold spring-transition border border-secondary/20">
            <Users className="h-3.5 w-3.5" />
            {userFilterName}
            <button onClick={() => { setUserFilter(null); setPage(0) }} className="ml-0.5 hover:text-secondary-foreground spring-transition">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
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
                    <TableHead className="text-xs font-medium">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-0.5 hover:text-foreground spring-transition">
                        {i18n.t('audit_log.date')}
                        <SortIcon active={sortKey === 'date'} dir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-medium">
                      <button onClick={() => toggleSort('action')} className="flex items-center gap-0.5 hover:text-foreground spring-transition">
                        {i18n.t('audit_log.action')}
                        <SortIcon active={sortKey === 'action'} dir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-medium">
                      <button onClick={() => toggleSort('user')} className="flex items-center gap-0.5 hover:text-foreground spring-transition">
                        {i18n.t('audit_log.user')}
                        <SortIcon active={sortKey === 'user'} dir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-medium">{i18n.t('audit_log.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/20 spring-fast">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatFull(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={actionVariants[entry.action] || 'default'}
                          className="rounded-full text-caption px-2.5 py-0.5"
                        >
                          {actionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.username ? (
                          <button
                            onClick={() => { setUserFilter(entry.userId); setPage(0) }}
                            className="hover:text-primary spring-transition underline decoration-dotted underline-offset-2"
                          >
                            {entry.username}
                          </button>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={entry.details}>
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3">
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
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={i18n.t('audit_log.clear')}
        description={i18n.t('audit_log.confirm_clear')}
        confirmText={i18n.t('audit_log.clear')}
        cancelText={i18n.t('cancel') || 'Cancel'}
        onConfirm={executeClearLog}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}
