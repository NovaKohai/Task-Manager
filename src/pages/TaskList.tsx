import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, AlertTriangle, Calendar, Trash2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { i18n } from '@/lib/i18n'
import { priorityBadge } from '@/lib/constants'

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export default function TaskList() {
  const navigate = useNavigate()
  const { tasks, filters, isLoading, setFilters, fetchTasks, deleteTask } = useTaskStore()
  const { users, fetchUsers } = useUserStore()

  useEffect(() => { fetchTasks(); fetchUsers() }, [fetchTasks, fetchUsers])

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const getUserName = useCallback((id: string | null): string => {
    if (!id) return '—'
    return users.find(u => u.id === id)?.name || '—'
  }, [users])

  return (
    <div className="space-y-5 page-bg">
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('nav.tasks')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">Manage and track all tasks</p>
        </div>
        <Button onClick={() => navigate('/tasks/create')} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          {i18n.t('task.create')}
        </Button>
      </div>

      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input aria-label={i18n.t('search')} placeholder={i18n.t('search')} className="h-9 rounded-xl bg-background/50 border-border/40 pl-9 spring-transition" value={filters.search || ''} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <Select aria-label={i18n.t('task.status')} value={filters.status || '_all'} onValueChange={(v) => setFilters({ ...filters, status: v === '_all' ? undefined : v })}>
              <SelectTrigger className="w-[150px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Statuses</SelectItem>
                <SelectItem value="todo">{i18n.t('task.status.todo')}</SelectItem>
                <SelectItem value="in_progress">{i18n.t('task.status.in_progress')}</SelectItem>
                <SelectItem value="done">{i18n.t('task.status.done')}</SelectItem>
                <SelectItem value="cancelled">{i18n.t('task.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select aria-label={i18n.t('task.priority')} value={filters.priority || '_all'} onValueChange={(v) => setFilters({ ...filters, priority: v === '_all' ? undefined : v })}>
              <SelectTrigger className="w-[150px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task.priority')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Priorities</SelectItem>
                <SelectItem value="low">{i18n.t('priority.low')}</SelectItem>
                <SelectItem value="medium">{i18n.t('priority.medium')}</SelectItem>
                <SelectItem value="high">{i18n.t('priority.high')}</SelectItem>
                <SelectItem value="critical">{i18n.t('priority.critical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-rise stagger-3">
        <div className="glass-panel-inner p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-base font-bold text-foreground">{i18n.t('task.no_tasks')}</p>
              <p className="text-sm text-muted-foreground mt-1">{i18n.t('task.no_tasks_desc')}</p>
              <Button className="mt-4 h-9 rounded-full bg-primary hover:bg-primary/90 text-xs font-bold spring-transition" onClick={() => navigate('/tasks/create')}>
                <Plus className="h-4 w-4" />
                {i18n.t('task.create')}
              </Button>
            </div>
          ) : (
            <Table>
              <caption className="sr-only">{i18n.t('nav.tasks')}</caption>
              <TableHeader>
                <TableRow>
                  <th scope="col" className="sr-only">Code</th>
                  <TableHead className="text-xs font-medium">Code</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('task.title')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('task.priority')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('task.status')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('task.assignee')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('task.due_date')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/20 spring-fast" onClick={() => navigate(`/tasks/${t.id}`)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.code}</TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">{t.title}</TableCell>
                    <TableCell>
                      <span className={cn('text-caption font-semibold px-2.5 py-0.5 rounded-full', priorityBadge[t.priority].variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
                        {i18n.t(`priority.${t.priority}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-caption font-semibold px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                        {i18n.t(`task.status.${t.status}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getUserName(t.assigneeId)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.dueDate)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full hover:bg-primary/10 hover:text-primary spring-transition" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${t.id}`) }}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive spring-transition" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(t.id) }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={deleteConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t('task.delete_confirm')}</DialogTitle>
            <DialogDescription>{i18n.t('task.delete_confirm_desc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="h-9 rounded-full spring-transition">{i18n.t('cancel')}</Button>
            <Button variant="danger" onClick={async () => { if (deleteConfirm) { await deleteTask(deleteConfirm); setDeleteConfirm(null) } }} className="h-9 rounded-full spring-transition">{i18n.t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
