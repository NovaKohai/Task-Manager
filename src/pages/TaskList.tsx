import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Calendar, Trash2, ClipboardList, X, LayoutGrid, Move, MoreVertical, ChevronUp, ChevronDown, Check } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, hasPermission } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { i18n } from '@/lib/i18n'
import { priorityBadge, roleBadge, getDepartmentConfig, getInitials } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { formatDate, findUser } from '@/lib/format'
import { toast } from '@/hooks/use-toast'
import type { Priority, TaskStatus, Task } from '@/lib/types'

type SortBy = 'updatedAt' | 'createdAt' | 'priority' | 'dueDate'

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2, critical: 3 }

export default function TaskList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { tasks, filters, isLoading, setFilters, fetchTasks, deleteTask, updateTask, reorderTasks } = useTaskStore()
  const { users, fetchUsers } = useUserStore()

  const [localSearch, setLocalSearch] = useState(() => {
    return searchParams.get('search') ?? filters.search ?? ''
  })
  const debouncedSearch = useDebounce(localSearch, 200)
  const initRef = useRef(false)

  // Initialize the store filters from URL params on first mount, then keep
  // non-search filters mirrored in the URL so refresh / share / back-button
  // restores the view.
  useEffect(() => {
    const initial = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      sortBy: (searchParams.get('sortBy') as SortBy | null) || undefined,
    }
    setFilters(initial)
    if (initial.search) setLocalSearch(initial.search)
    initRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push non-search filter changes back to URL.
  useEffect(() => {
    if (!initRef.current) return
    const next = new URLSearchParams()
    if (filters.search) next.set('search', filters.search)
    if (filters.status) next.set('status', filters.status)
    if (filters.priority) next.set('priority', filters.priority)
    if (filters.assigneeId) next.set('assigneeId', filters.assigneeId)
    if (filters.sortBy) next.set('sortBy', filters.sortBy)
    const currentView = searchParams.get('view')
    if (currentView) next.set('view', currentView)
    setSearchParams(next, { replace: true })
  }, [filters.status, filters.priority, filters.assigneeId, filters.sortBy, filters.search, searchParams, setSearchParams])

  // Debounced search -> store. `search` is excluded from the URL-sync effect's
  // direct deps (but lives in `filters`) so the loop is naturally one-way.
  useEffect(() => {
    const current = useTaskStore.getState().filters.search || ''
    if (debouncedSearch !== current) {
      setFilters({ ...useTaskStore.getState().filters, search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, setFilters])

  useEffect(() => { fetchTasks(); fetchUsers() }, [fetchTasks, fetchUsers])

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const assignee = useCallback((id: string | null) => findUser(users, id), [users])

  const viewMode = searchParams.get('view') || 'list'

  const canEditTask = useCallback((task: Task) => {
    if (!user) return false
    if (hasPermission(user, 'task.edit')) return true
    if (hasPermission(user, 'task.edit.own') && (task.assigneeId === user.id || task.creatorId === user.id)) return true
    return false
  }, [user])

  const canReorder = useMemo(() => {
    return user ? hasPermission(user, 'task.reorder') : false
  }, [user])

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Keyboard Move Mode States
  const [activeKeyboardMoveTaskId, setActiveKeyboardMoveTaskId] = useState<string | null>(null)
  const [originalState, setOriginalState] = useState<{ status: TaskStatus; taskIds: string[] } | null>(null)
  const [showCardMenuTaskId, setShowCardMenuTaskId] = useState<string | null>(null)

  const boardTasks = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      under_review: [],
      done: [],
      cancelled: [],
    }
    const filtered = tasks.filter(t => {
      if (filters.search) {
        const s = filters.search.toLowerCase()
        if (!t.title.toLowerCase().includes(s) && !t.code.toLowerCase().includes(s)) return false
      }
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false
      if (filters.status && t.status !== filters.status) return false
      return true
    })

    filtered.forEach(t => {
      if (grouped[t.status]) {
        grouped[t.status].push(t)
      }
    })

    Object.keys(grouped).forEach(k => {
      grouped[k as TaskStatus].sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
    })

    return grouped
  }, [tasks, filters.search, filters.priority, filters.assigneeId, filters.status])

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canEditTask(task)) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
    setDraggedTaskId(task.id)
  }

  const handleDragOverColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (dragOverColumn !== status) {
      setDragOverColumn(status)
    }
  }

  const handleDragOverCard = (e: React.DragEvent, status: TaskStatus, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragOverColumn !== status) setDragOverColumn(status)
    if (draggedOverTaskId !== taskId && draggedTaskId !== taskId) {
      setDraggedOverTaskId(taskId)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
    setDraggedOverTaskId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus, targetTaskId?: string) => {
    e.preventDefault()
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain')
    
    setDraggedTaskId(null)
    setDraggedOverTaskId(null)
    setDragOverColumn(null)

    if (!taskId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const isStatusChange = task.status !== targetStatus
    if (isStatusChange) {
      if (!canEditTask(task)) {
        toast({
          title: i18n.t('error'),
          description: i18n.lang === 'ar' ? 'ليست لديك صلاحية تعديل هذه المهمة' : 'You do not have permission to edit this task',
          variant: 'destructive'
        })
        return
      }

      if (targetStatus === 'done' && !hasPermission(user, 'task.verify')) {
        toast({
          title: i18n.t('error'),
          description: i18n.t('task.verify_error'),
          variant: 'destructive'
        })
        return
      }
    } else {
      if (!canReorder) {
        toast({
          title: i18n.t('error'),
          description: i18n.lang === 'ar' ? 'ليست لديك صلاحية إعادة ترتيب المهام' : 'You do not have permission to reorder tasks',
          variant: 'destructive'
        })
        return
      }
    }

    const columnTasks = tasks
      .filter(t => t.status === targetStatus && t.id !== taskId)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))

    let newOrderIds: string[] = []
    if (targetTaskId) {
      const idx = columnTasks.findIndex(t => t.id === targetTaskId)
      if (idx !== -1) {
        newOrderIds = [
          ...columnTasks.slice(0, idx).map(t => t.id),
          taskId,
          ...columnTasks.slice(idx).map(t => t.id)
        ]
      } else {
        newOrderIds = [...columnTasks.map(t => t.id), taskId]
      }
    } else {
      newOrderIds = [...columnTasks.map(t => t.id), taskId]
    }

    if (isStatusChange) {
      await updateTask(taskId, { status: targetStatus })
    }
    
    if (canReorder || !isStatusChange) {
      await reorderTasks(targetStatus, newOrderIds)
    }

    toast({
      description: isStatusChange 
        ? i18n.t('task.kanban.status_updated') 
        : i18n.t('task.kanban.order_updated'),
      variant: 'success'
    })
  }

  const handleKeyboardMoveKeyDown = async (e: React.KeyboardEvent, task: Task) => {
    const columns: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'done', 'cancelled']
    const isRTL = i18n.lang === 'ar'
    const statusTasks = tasks
      .filter(t => t.status === task.status)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
    const currentIdx = statusTasks.findIndex(t => t.id === task.id)

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setActiveKeyboardMoveTaskId(null)
      setOriginalState(null)
      toast({
        description: i18n.t('task.kanban.order_updated'),
        variant: 'success'
      })
      setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      if (originalState) {
        if (task.status !== originalState.status) {
          await updateTask(task.id, { status: originalState.status })
        }
        await reorderTasks(originalState.status, originalState.taskIds)
      }
      setActiveKeyboardMoveTaskId(null)
      setOriginalState(null)
      toast({
        description: i18n.lang === 'ar' ? 'تم إلغاء النقل' : 'Move cancelled',
      })
      setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!canReorder) return
      if (currentIdx > 0) {
        const newIds = statusTasks.map(t => t.id)
        newIds[currentIdx] = newIds[currentIdx - 1]
        newIds[currentIdx - 1] = task.id
        await reorderTasks(task.status, newIds)
        setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!canReorder) return
      if (currentIdx < statusTasks.length - 1) {
        const newIds = statusTasks.map(t => t.id)
        newIds[currentIdx] = newIds[currentIdx + 1]
        newIds[currentIdx + 1] = task.id
        await reorderTasks(task.status, newIds)
        setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
      }
      return
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const colIdx = columns.indexOf(task.status)
      let targetColIdx = colIdx
      if (e.key === 'ArrowRight') {
        targetColIdx = isRTL ? colIdx - 1 : colIdx + 1
      } else {
        targetColIdx = isRTL ? colIdx + 1 : colIdx - 1
      }

      if (targetColIdx >= 0 && targetColIdx < columns.length) {
        const nextStatus = columns[targetColIdx]
        if (!canEditTask(task)) {
          toast({
            title: i18n.t('error'),
            description: i18n.lang === 'ar' ? 'ليست لديك صلاحية تعديل هذه المهمة' : 'You do not have permission to edit this task',
            variant: 'destructive'
          })
          return
        }
        if (nextStatus === 'done' && !hasPermission(user, 'task.verify')) {
          toast({
            title: i18n.t('error'),
            description: i18n.t('task.verify_error'),
            variant: 'destructive'
          })
          return
        }
        await updateTask(task.id, { status: nextStatus })
        const destTasks = tasks
          .filter(t => t.status === nextStatus && t.id !== task.id)
          .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
          .map(t => t.id)
        await reorderTasks(nextStatus, [...destTasks, task.id])
        setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
      }
    }
  }

  const startKeyboardMove = (e: React.KeyboardEvent | React.MouseEvent, task: Task) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canEditTask(task)) {
      toast({
        title: i18n.t('error'),
        description: i18n.lang === 'ar' ? 'ليست لديك صلاحية تعديل هذه المهمة' : 'You do not have permission to edit this task',
        variant: 'destructive'
      })
      return
    }
    const statusTasks = tasks
      .filter(t => t.status === task.status)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
    setOriginalState({
      status: task.status,
      taskIds: statusTasks.map(t => t.id)
    })
    setActiveKeyboardMoveTaskId(task.id)
    toast({
      description: i18n.lang === 'ar' ? 'تم تفعيل نمط النقل. استخدم الأسهم للنقل.' : 'Move mode active. Use Arrow keys to move.',
    })
    setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 50)
  }

  const moveTaskUp = async (task: Task) => {
    if (!canReorder) return
    const statusTasks = tasks
      .filter(t => t.status === task.status)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
    const idx = statusTasks.findIndex(t => t.id === task.id)
    if (idx > 0) {
      const newIds = statusTasks.map(t => t.id)
      newIds[idx] = newIds[idx - 1]
      newIds[idx - 1] = task.id
      await reorderTasks(task.status, newIds)
      toast({ description: i18n.t('task.kanban.order_updated'), variant: 'success' })
    }
  }

  const moveTaskDown = async (task: Task) => {
    if (!canReorder) return
    const statusTasks = tasks
      .filter(t => t.status === task.status)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
    const idx = statusTasks.findIndex(t => t.id === task.id)
    if (idx < statusTasks.length - 1) {
      const newIds = statusTasks.map(t => t.id)
      newIds[idx] = newIds[idx + 1]
      newIds[idx + 1] = task.id
      await reorderTasks(task.status, newIds)
      toast({ description: i18n.t('task.kanban.order_updated'), variant: 'success' })
    }
  }

  const moveTaskToStatus = async (task: Task, destStatus: TaskStatus) => {
    if (!canEditTask(task)) {
      toast({
        title: i18n.t('error'),
        description: i18n.lang === 'ar' ? 'ليست لديك صلاحية تعديل هذه المهمة' : 'You do not have permission to edit this task',
        variant: 'destructive'
      })
      return
    }
    if (destStatus === 'done' && !hasPermission(user, 'task.verify')) {
      toast({
        title: i18n.t('error'),
        description: i18n.t('task.verify_error'),
        variant: 'destructive'
      })
      return
    }
    await updateTask(task.id, { status: destStatus })
    const destTasks = tasks
      .filter(t => t.status === destStatus && t.id !== task.id)
      .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0))
      .map(t => t.id)
    await reorderTasks(destStatus, [...destTasks, task.id])
    toast({ description: i18n.t('task.kanban.status_updated'), variant: 'success' })
  }

  const renderTaskCard = (t: Task, status: TaskStatus, idx: number, statusTasks: Task[]) => {
    const columns: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'done', 'cancelled']
    return (
      <div
        key={t.id}
        id={`task-card-${t.id}`}
        tabIndex={0}
        draggable={canEditTask(t)}
        onDragStart={(e) => handleDragStart(e, t)}
        onDragOver={(e) => handleDragOverCard(e, t.status, t.id)}
        onDrop={(e) => handleDrop(e, t.status, t.id)}
        onKeyDown={(e) => {
          if (activeKeyboardMoveTaskId === t.id) {
            handleKeyboardMoveKeyDown(e, t)
          } else if (e.key === ' ' || e.key === 'Enter') {
            startKeyboardMove(e, t)
          }
        }}
        className={cn(
          "glass-panel !p-0.5 rounded-xl spring-transition select-none cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          activeKeyboardMoveTaskId === t.id && "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-raised",
          draggedOverTaskId === t.id && "border-primary border-dashed border-2 opacity-50"
        )}
      >
        <div className="glass-panel-inner !p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
            <div className="flex items-center gap-1">
              <span className={cn('text-micro font-semibold px-2 py-0.5 rounded-full', 
                priorityBadge[t.priority].variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
                {i18n.t(`priority.${t.priority}`)}
              </span>
            </div>
          </div>
          
          <h3 className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{t.title}</h3>
          
          {t.project && (
            <span className="inline-block text-micro text-muted-foreground/80 bg-muted/40 rounded px-1.5 py-0.5">{t.project}</span>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border/5">
            <span className="flex items-center gap-1 text-micro text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(t.dueDate)}
            </span>
            
            {(() => {
              const userObj = assignee(t.assigneeId)
              if (!userObj) return null
              return (
                <div className="flex items-center gap-1" title={`${userObj.name} - ${i18n.t(`user.${userObj.role}`)}`}>
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                    {getInitials(userObj.name)}
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-micro rounded-lg hover:bg-primary/10 hover:text-primary spring-transition" 
              onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${t.id}`) }}
            >
              {i18n.t('task_list.view')}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground spring-transition"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCardMenuTaskId(showCardMenuTaskId === t.id ? null : t.id)
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>

              {showCardMenuTaskId === t.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowCardMenuTaskId(null) }} />
                  <div className="absolute right-0 mt-1 w-44 bg-surface border rounded-xl shadow-diffusion p-1 z-20 animate-rise" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        setShowCardMenuTaskId(null)
                        startKeyboardMove(e, t)
                      }}
                      className="w-full text-left rtl:text-right px-2.5 py-1.5 text-micro rounded-lg hover:bg-primary/10 hover:text-primary spring-fast flex items-center gap-1.5 border-0 bg-transparent cursor-pointer"
                    >
                      <Move className="h-3 w-3" />
                      {i18n.lang === 'ar' ? 'تحريك (لوحة المفاتيح)' : 'Move (Keyboard)'}
                    </button>

                    {canReorder && (
                      <>
                        <button
                          disabled={idx === 0}
                          onClick={() => { setShowCardMenuTaskId(null); moveTaskUp(t) }}
                          className="w-full text-left rtl:text-right px-2.5 py-1.5 text-micro rounded-lg hover:bg-primary/10 hover:text-primary spring-fast flex items-center gap-1.5 border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <ChevronUp className="h-3 w-3" />
                          {i18n.t('task.kanban.move_up')}
                        </button>
                        <button
                          disabled={idx === statusTasks.length - 1}
                          onClick={() => { setShowCardMenuTaskId(null); moveTaskDown(t) }}
                          className="w-full text-left rtl:text-right px-2.5 py-1.5 text-micro rounded-lg hover:bg-primary/10 hover:text-primary spring-fast flex items-center gap-1.5 border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <ChevronDown className="h-3 w-3" />
                          {i18n.t('task.kanban.move_down')}
                        </button>
                      </>
                    )}
                    
                    <div className="h-px bg-border/5 my-1" />
                    
                    {columns.map(col => {
                      if (col === t.status) return null
                      return (
                        <button
                          key={col}
                          onClick={() => { setShowCardMenuTaskId(null); moveTaskToStatus(t, col) }}
                          className="w-full text-left rtl:text-right px-2.5 py-1.5 text-micro rounded-lg hover:bg-primary/10 hover:text-primary spring-fast flex items-center gap-1.5 border-0 bg-transparent cursor-pointer"
                        >
                          <Check className="h-3 w-3 opacity-0" />
                          {i18n.t(`task.kanban.move_to`).replace('{status}', i18n.t(`task.status.${col}`))}
                        </button>
                      )
                    })}

                    {hasPermission(user, 'task.delete') && (
                      <>
                        <div className="h-px bg-border/5 my-1" />
                        <button
                          onClick={() => { setShowCardMenuTaskId(null); setDeleteConfirm(t.id) }}
                          className="w-full text-left rtl:text-right px-2.5 py-1.5 text-micro rounded-lg text-destructive hover:bg-destructive/10 spring-fast flex items-center gap-1.5 border-0 bg-transparent cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          {i18n.t('delete')}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderKanbanBoard = () => {
    const columns: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'done', 'cancelled']
    return (
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-rise stagger-3">
          {columns.map((colStatus) => {
            const colTasks = boardTasks[colStatus]
            const isOver = dragOverColumn === colStatus

            return (
              <div
                key={colStatus}
                onDragOver={(e) => handleDragOverColumn(e, colStatus)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, colStatus)}
                className={cn(
                  "glass-panel rounded-2xl min-h-[500px] flex flex-col transition-all duration-200 border-2",
                  isOver ? "bg-primary/5 border-primary/20 scale-[1.005] shadow-diffusion" : "bg-surface/20 border-border/10"
                )}
              >
                <div className="glass-panel-inner !p-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
                    <h2 className="text-xs font-bold text-foreground">
                      {i18n.t(`task.status.${colStatus}`)}
                    </h2>
                    <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] min-h-[400px]">
                    {colTasks.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/20 rounded-xl text-micro text-muted-foreground/60 select-none">
                        <ClipboardList className="h-5 w-5 mb-1.5 opacity-40" />
                        {i18n.t('task.no_tasks')}
                      </div>
                    ) : (
                      colTasks.map((t, idx) => renderTaskCard(t, colStatus, idx, colTasks))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {activeKeyboardMoveTaskId && (() => {
          const movingTask = tasks.find(t => t.id === activeKeyboardMoveTaskId)
          if (!movingTask) return null
          return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground/90 backdrop-blur text-background rounded-full px-5 py-2.5 flex items-center gap-3 border shadow-diffusion text-xs font-semibold z-50 animate-bounce select-none">
              <Move className="h-4 w-4 text-primary animate-pulse" />
              <span>
                {i18n.t('task.kanban.keyboard_help').replace('{status}', i18n.t(`task.status.${movingTask.status}`))}
              </span>
              <span className="text-primary font-bold">
                ({movingTask.title})
              </span>
            </div>
          )
        })()}
      </div>
    )
  }

  const sortedTasks = useMemo(() => {
    const sb = (filters.sortBy ?? 'updatedAt') as SortBy
    const copy = [...tasks]
    copy.sort((a, b) => {
      switch (sb) {
        case 'createdAt': {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        case 'priority': {
          return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
        }
        case 'dueDate': {
          const av = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bv = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return av - bv
        }
        case 'updatedAt':
        default: {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        }
      }
    })
    return copy
  }, [tasks, filters.sortBy])

  const hasActiveFilters =
    Boolean(filters.search || filters.status || filters.priority || filters.assigneeId) ||
    (filters.sortBy && filters.sortBy !== 'updatedAt')

  function handleClearFilters() {
    setFilters({ sortBy: 'updatedAt' })
    setLocalSearch('')
  }

  return (
    <div className="space-y-5 page-bg">
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('nav.tasks')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('task_list.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-muted/40 p-1 border border-border/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('view', 'list')
                setSearchParams(next, { replace: true })
              }}
              className={cn(
                "h-8 rounded-full text-xs font-semibold px-3 spring-transition",
                viewMode === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
              {i18n.t('task_list.view_list')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('view', 'board')
                setSearchParams(next, { replace: true })
              }}
              className={cn(
                "h-8 rounded-full text-xs font-semibold px-3 spring-transition",
                viewMode === 'board' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
              {i18n.t('task_list.view_board')}
            </Button>
          </div>
          <Button onClick={() => navigate('/tasks/create')} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            {i18n.t('task.create')}
          </Button>
        </div>
      </div>

      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input aria-label={i18n.t('search')} placeholder={i18n.t('search')} className="h-9 rounded-xl bg-background/50 border-border/40 pl-9 spring-transition" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
            </div>
            <Select aria-label={i18n.t('task.status')} value={filters.status || '_all'} onValueChange={(v) => setFilters({ ...filters, status: v === '_all' ? undefined : v })}>
              <SelectTrigger className="w-[150px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{i18n.t('task_list.all_statuses')}</SelectItem>
                <SelectItem value="todo">{i18n.t('task.status.todo')}</SelectItem>
                <SelectItem value="in_progress">{i18n.t('task.status.in_progress')}</SelectItem>
                <SelectItem value="under_review">{i18n.t('task.status.under_review')}</SelectItem>
                <SelectItem value="done">{i18n.t('task.status.done')}</SelectItem>
                <SelectItem value="cancelled">{i18n.t('task.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select aria-label={i18n.t('task.priority')} value={filters.priority || '_all'} onValueChange={(v) => setFilters({ ...filters, priority: v === '_all' ? undefined : v })}>
              <SelectTrigger className="w-[150px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task.priority')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{i18n.t('task_list.all_priorities')}</SelectItem>
                <SelectItem value="low">{i18n.t('priority.low')}</SelectItem>
                <SelectItem value="medium">{i18n.t('priority.medium')}</SelectItem>
                <SelectItem value="high">{i18n.t('priority.high')}</SelectItem>
                <SelectItem value="critical">{i18n.t('priority.critical')}</SelectItem>
              </SelectContent>
            </Select>
            <Select aria-label={i18n.t('task.assignee')} value={filters.assigneeId || '_all'} onValueChange={(v) => setFilters({ ...filters, assigneeId: v === '_all' ? undefined : v })}>
              <SelectTrigger className="w-[170px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task.assignee')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{i18n.t('task_list.all_assignees')}</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select aria-label={i18n.t('task_list.sort_by')} value={filters.sortBy || 'updatedAt'} onValueChange={(v) => setFilters({ ...filters, sortBy: v === 'updatedAt' ? undefined : (v as SortBy) })}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl border-border/40 bg-background/50"><SelectValue placeholder={i18n.t('task_list.sort_by')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">{i18n.t('task_list.sort_updated')}</SelectItem>
                <SelectItem value="createdAt">{i18n.t('task_list.sort_created')}</SelectItem>
                <SelectItem value="priority">{i18n.t('task_list.sort_priority')}</SelectItem>
                <SelectItem value="dueDate">{i18n.t('task_list.sort_due')}</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 spring-transition">
                <X className="h-3.5 w-3.5" />
                {i18n.t('task_list.clear_filters')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="glass-panel animate-rise stagger-3">
          <div className="glass-panel-inner p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sortedTasks.length === 0 ? (
              <EmptyState
                title={i18n.t('task.no_tasks')}
                description={i18n.t('task.no_tasks_desc')}
                actionText={i18n.t('task.create')}
                onAction={() => navigate('/tasks/create')}
                icon={<ClipboardList className="h-8 w-8" />}
              />
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
                  {sortedTasks.map((t) => (
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
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          const userObj = assignee(t.assigneeId)
                          if (!userObj) return '—'
                          return <span className="inline-flex items-center gap-1.5"><span>{userObj.name}</span><Badge variant={roleBadge[userObj.role]} className="rounded-full text-micro px-1.5 py-0">{i18n.t(`user.${userObj.role}`)}</Badge>{userObj.department ? <Badge variant={getDepartmentConfig(userObj.department).variant} className="rounded-full text-micro px-1.5 py-0">{i18n.t(getDepartmentConfig(userObj.department).label)}</Badge> : null}</span>
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.dueDate)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full hover:bg-primary/10 hover:text-primary spring-transition" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${t.id}`) }}>
                            {i18n.t('task_list.view')}
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
      ) : (
        renderKanbanBoard()
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={i18n.t('task.delete_confirm')}
        description={i18n.t('task.delete_confirm_desc')}
        confirmText={i18n.t('delete')}
        cancelText={i18n.t('cancel')}
        onConfirm={async () => { if (deleteConfirm) { await deleteTask(deleteConfirm); setDeleteConfirm(null) } }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
