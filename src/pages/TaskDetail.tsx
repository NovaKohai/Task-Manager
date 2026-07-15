import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, CheckCircle2, Circle, Clock, Edit3, MessageSquare,
  Plus, Target, Trash2, Send, Download, User, XCircle, ListChecks, Paperclip,
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useCommentStore } from '@/stores/commentStore'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { priorityBadge, getInitials, roleBadge, getDepartmentConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { formatFull } from '@/lib/format'
import { tokenizeContent } from '@/lib/mentions'
import type { TaskStatus } from '@/lib/types'

function CommentBody({ content, usernames }: { content: string; usernames: Set<string> }) {
  const tokens = useMemo(() => tokenizeContent(content, usernames), [content, usernames])
  return (
    <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
      {tokens.map((t, idx) =>
        t.type === 'mention' ? (
          <span key={idx} className="font-bold text-primary bg-primary/10 rounded px-1 py-0.5" data-mention={t.username}>
            {t.value}
          </span>
        ) : (
          <span key={idx}>{t.value}</span>
        )
      )}
    </p>
  )
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTask, isLoading: taskLoading, fetchTask, updateTask, deleteTask, subtasks, fetchSubtasks, createSubtask, toggleSubtask, deleteSubtask } = useTaskStore()
  const { comments, isLoading: commentLoading, fetchComments, addComment, editComment, deleteComment } = useCommentStore()
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUserStore()

  const [commentText, setCommentText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [taskDeleteConfirm, setTaskDeleteConfirm] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  // Time Tracker state and handlers
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [showIdleDialog, setShowIdleDialog] = useState(false)
  const timerRef = useRef<any>(null)
  const lastActiveRef = useRef<number>(Date.now())

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(s => s + 1)
        if (Date.now() - lastActiveRef.current > 60 * 1000) {
          setIsTimerRunning(false)
          setShowIdleDialog(true)
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning])

  useEffect(() => {
    const resetIdleTimer = () => {
      lastActiveRef.current = Date.now()
    }
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
    }
  }, [])

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      const mins = Math.ceil(secondsElapsed / 60)
      if (mins > 0 && id && user) {
        db.addTimeEntry({
          taskId: id,
          userId: user.id,
          startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          durationMinutes: mins,
          kind: 'focus',
          notes: 'Logged via active task timer'
        })
        toast({
          description: i18n.t('task.time_logged_toast').replace('{mins}', String(mins)),
          variant: 'success'
        })
      }
      setIsTimerRunning(false)
      setSecondsElapsed(0)
    } else {
      setIsTimerRunning(true)
      lastActiveRef.current = Date.now()
    }
  }

  const loggedMinutes = id ? db.getTimeEntries({ taskId: id }).reduce((sum, e) => sum + e.durationMinutes, 0) : 0

  useEffect(() => {
    if (id) {
      fetchTask(id)
      fetchComments(id)
      fetchSubtasks(id)
      fetchUsers()
    }
    const handleRealtime = () => {
      if (id) {
        fetchTask(id)
        fetchComments(id)
      }
    }
    window.addEventListener('ttm_realtime_update', handleRealtime)
    return () => window.removeEventListener('ttm_realtime_update', handleRealtime)
  }, [id, fetchTask, fetchComments, fetchSubtasks, fetchUsers])

  async function handleStatusChange(status: TaskStatus) {
    if (!id) return
    await updateTask(id, { status })
    fetchTask(id)
  }

  async function handleAddComment() {
    if (!commentText.trim() || !user || !id) return
    await addComment(id, user.id, commentText.trim())
    setCommentText('')
  }

  async function handleEditComment(commentId: string) {
    if (!editText.trim()) return
    await editComment(commentId, editText.trim())
    setEditingId(null); setEditText('')
  }

  async function handleDeleteComment(commentId: string) {
    await deleteComment(commentId)
    setDeleteConfirm(null)
  }

  const handleMockAttachment = () => {
    const mockFiles = ['proposal_final.pdf', 'requirements_draft.docx', 'design_mockup.png', 'database_schema.xlsx']
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)]
    const attachmentStr = ` [📎 Attachment: C:\\CompanyDrive\\${randomFile}]`
    setCommentText(prev => prev + attachmentStr)
    toast({
      description: i18n.t('task.attachment_toast'),
      variant: 'success'
    })
  }



  async function handleCreateSubtask() {
    if (!newSubtaskTitle.trim() || !user || !id) return
    await createSubtask({
      title: newSubtaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: user.id,
      creatorId: t.creatorId,
      dueDate: null,
      estHours: null,
      parentTaskId: id,
    })
    setNewSubtaskTitle('')
  }

  async function handleDeleteSubtask(subtaskId: string) {
    await deleteSubtask(subtaskId)
  }

  const getUser = useCallback((userId: string) => {
    return users.find(u => u.id === userId) || null
  }, [users])

  const getUserName = useCallback((userId: string): string => {
    return getUser(userId)?.name || 'Unknown'
  }, [getUser])

  const statusTransitions = useMemo(() => {
    const isVerifier = user ? hasPermission(user, 'task.verify') : false
    const list: { from: TaskStatus[]; to: TaskStatus; label: string; variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'warning' }[] = [
      { from: ['todo'], to: 'in_progress', label: i18n.t('task_detail.start'), variant: 'primary' },
    ]
    if (isVerifier) {
      list.push({ from: ['in_progress', 'under_review'] as TaskStatus[], to: 'done' as TaskStatus, label: i18n.t('task.approve'), variant: 'success' as const })
      list.push({ from: ['under_review'] as TaskStatus[], to: 'in_progress' as TaskStatus, label: i18n.t('task.reject'), variant: 'secondary' as const })
    } else {
      list.push({ from: ['in_progress'] as TaskStatus[], to: 'under_review' as TaskStatus, label: i18n.t('task.submit_review'), variant: 'success' as const })
    }
    list.push({ from: ['todo', 'in_progress', 'under_review'] as TaskStatus[], to: 'cancelled' as TaskStatus, label: i18n.t('task.cancel'), variant: 'danger' as const })
    return list
  }, [user])

  const knownUsernames = useMemo(
    () => new Set(users.map(u => u.username.toLowerCase())),
    [users]
  )

  if (taskLoading || !currentTask) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const t = currentTask

  const canToggle = user ? hasPermission(user, 'subtask.toggle') : false
  const canCreate = user ? hasPermission(user, 'task.create') : false
  const canDelete = user ? hasPermission(user, 'task.delete') : false

  return (
    <div className="space-y-8 page-bg">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-rise stagger-1">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 rounded-full hover:bg-muted/40 spring-transition">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button type="button" className="cursor-pointer hover:text-foreground bg-transparent border-0 p-0 font-inherit text-inherit spring-fast" onClick={() => navigate('/tasks')}>{i18n.t('nav.tasks')}</button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-foreground truncate max-w-[300px] font-semibold">{t.title}</span>
      </div>

      {/* Main Task Card */}
      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight text-foreground">{t.title}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">{t.code}</p>
            </div>
            <div className="flex gap-2 shrink-0 items-center">
              <span className={cn('text-caption font-semibold px-2.5 py-0.5 rounded-full', priorityBadge[t.priority].variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>{i18n.t(`priority.${t.priority}`)}</span>
              <span className="text-caption font-semibold px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{i18n.t(`task.status.${t.status}`)}</span>
              <Button variant="ghost" size="icon" onClick={async () => { const { exportTaskPDF } = await import('@/lib/export'); exportTaskPDF(t, users) }} className="h-7 w-7 rounded-full hover:bg-muted/40 spring-transition" title={i18n.t('task_detail.export_pdf')}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground/90 max-w-prose">{t.description || i18n.t('task_detail.no_description')}</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 pt-2">
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.assignee')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><User className="h-3 w-3 shrink-0 text-primary" />{t.assigneeId ? (() => { const asUser = getUser(t.assigneeId!); return asUser ? <span className="inline-flex items-center gap-1.5 flex-wrap"><span>{asUser.name}</span><Badge variant={roleBadge[asUser.role]} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(`user.${asUser.role}`)}</Badge>{asUser.department ? <Badge variant={getDepartmentConfig(asUser.department).variant} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(getDepartmentConfig(asUser.department).label)}</Badge> : null}</span> : 'Unknown' })() : i18n.t('task_detail.unassigned')}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.due_date')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Calendar className="h-3 w-3 shrink-0 text-primary" />{t.dueDate ? formatFull(t.dueDate) : '—'}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.est_hours')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Clock className="h-3 w-3 shrink-0 text-primary" />{t.estHours ? `${t.estHours}h` : '—'}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.time_tracker')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Clock className="h-3 w-3 shrink-0 text-primary" />{Math.round((loggedMinutes / 60) * 10) / 10}h</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.created')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Calendar className="h-3 w-3 shrink-0 text-primary" />{formatFull(t.createdAt)}</p>
            </div>
          </div>

          {t.project && (
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10 inline-block">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task_detail.project')}</Label>
              <p className="mt-0.5 text-sm font-semibold">{t.project}</p>
            </div>
          )}



          <div className="flex flex-wrap gap-2 pt-2">
            {statusTransitions.filter(s => s.from.includes(t.status)).map(s => (
              <Button key={s.to} variant={s.variant} size="sm" onClick={() => handleStatusChange(s.to)} className="h-8 rounded-full text-xs font-bold spring-transition">
                {s.to === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.to === 'cancelled' ? <XCircle className="h-3.5 w-3.5" /> : null}
                {s.label}
              </Button>
            ))}
            {t.assigneeId === user?.id && t.status === 'in_progress' && (
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/10 rounded-full px-2 py-0.5">
                <span className="text-micro font-bold font-mono px-2 text-foreground/80">{Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggleTimer} 
                  className={cn(
                    "h-6 px-3 rounded-full text-micro font-bold spring-transition", 
                    isTimerRunning ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  )}
                >
                  {isTimerRunning ? i18n.t('task.time_stop') : i18n.t('task.time_start')}
                </Button>
              </div>
            )}
            {t.assigneeId === user?.id && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/focus/${id}`)} className="h-8 rounded-full text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 spring-transition">
                <Target className="h-3.5 w-3.5" />
                {i18n.t('focus.start')}
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setTaskDeleteConfirm(true)} className="h-8 rounded-full text-xs font-bold spring-transition">
              <Trash2 className="h-3.5 w-3.5" />
              {i18n.t('delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="glass-panel animate-rise stagger-3">
        <div className="glass-panel-inner">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">{i18n.t('task_detail.acceptance_criteria')}</h2>
          <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground/60">
            {i18n.t('task_detail.no_criteria')}
          </div>
        </div>
      </div>

      {/* Subtasks */}
      <div className="glass-panel animate-rise stagger-3">
        <div className="glass-panel-inner">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {i18n.t('task_detail.subtasks')} ({subtasks.length})
            </h2>
            {subtasks.length > 0 && (
              <span className="text-caption text-muted-foreground font-mono">
                {subtasks.filter(s => s.status === 'done').length}/{subtasks.length}
              </span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {subtasks.map(st => {
                const done = st.status === 'done'
                return (
                  <div key={st.id} className="flex items-center gap-2.5 group rounded-lg px-2 py-1.5 hover:bg-muted/20 spring-fast">
                    {canToggle ? (
                      <button
                        onClick={() => toggleSubtask(st.id)}
                        className="shrink-0 text-primary hover:text-primary/70 spring-fast bg-transparent border-0 cursor-pointer p-0"
                        aria-label={done ? i18n.t('task.undone') : i18n.t('task.done')}
                      >
                        {done
                          ? <CheckCircle2 className="h-4 w-4 text-primary" />
                          : <Circle className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                        }
                      </button>
                    ) : (
                      <span className="shrink-0">
                        {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                      </span>
                    )}
                    <span className={cn('flex-1 text-sm', done && 'line-through text-muted-foreground/60')}>{st.title}</span>
                    <span className="text-caption text-muted-foreground font-mono">{st.code}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="shrink-0 text-muted-foreground/0 group-hover:text-destructive hover:text-destructive/80 spring-fast bg-transparent border-0 cursor-pointer p-0"
                        aria-label={i18n.t('delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {subtasks.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border/40 p-5 text-center text-sm text-muted-foreground/60 mb-4">
              <ListChecks className="h-4 w-4 mx-auto mb-1 opacity-50" />
              {i18n.t('task_detail.no_subtasks')}
            </div>
          )}

          {canCreate && (
            <div className="flex gap-2">
              <Input
                aria-label={i18n.t('task_detail.add_subtask')}
                placeholder={i18n.t('task_detail.add_subtask_placeholder')}
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubtask() } }}
                className="h-9 rounded-xl bg-background/50 border-border/40 text-sm spring-transition flex-1"
                maxLength={200}
              />
              <Button
                size="icon"
                onClick={handleCreateSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90 spring-transition"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="glass-panel animate-rise stagger-4">
        <div className="glass-panel-inner">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">{i18n.t('task_detail.comments')} ({comments.length})</h2>

          <div className="flex gap-2 mb-1">
            <Button variant="ghost" size="icon" onClick={handleMockAttachment} className="h-10 w-10 shrink-0 rounded-full border border-border/20 text-muted-foreground hover:text-foreground spring-transition" title={i18n.t('task.comments.attachment')}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input id="comment-input" aria-label={i18n.t('comment.placeholder')} placeholder={i18n.t('comment.placeholder')} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition flex-1" maxLength={2000} />
            <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()} className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 spring-transition">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-caption text-muted-foreground/60 mb-5 px-1">{i18n.t('comment.mention_help')}</p>

          {commentLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="empty-state-desc">{i18n.t('comment.no_comments')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const isOwner = c.authorId === user?.id
                return (
                  <div key={c.id} className="flex gap-3 rounded-xl border border-border/10 p-4 hover:border-border/30 spring-fast bg-muted/10">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/10">
                      <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">{getInitials(getUserName(c.authorId))}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{getUserName(c.authorId)}</span>
                        {(() => { const commentAuthor = getUser(c.authorId); return commentAuthor ? <Badge variant={roleBadge[commentAuthor.role]} className="rounded-full text-micro px-1.5 py-0.5">{i18n.t(`user.${commentAuthor.role}`)}</Badge> : null })()}
                        <span className="text-caption text-muted-foreground font-mono">{formatFull(c.createdAt)}</span>
                        {c.editedAt && <span className="text-caption text-muted-foreground/60">{i18n.t('task_detail.edited')}</span>}
                      </div>
                      {editingId === c.id ? (
                        <div className="flex gap-2">
                          <Input aria-label={i18n.t('edit')} value={editText} onChange={(e) => setEditText(e.target.value)} className="h-8 text-sm rounded-xl bg-background/50 flex-1 spring-transition" />
                          <Button size="sm" onClick={() => handleEditComment(c.id)} className="h-8 text-xs rounded-full spring-transition">{i18n.t('task_detail.save_edit')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs rounded-full spring-transition">{i18n.t('task_detail.cancel_edit')}</Button>
                        </div>
                      ) : (
                        <CommentBody content={c.content} usernames={knownUsernames} />
                      )}
                      {editingId !== c.id && (
                        <div className="flex gap-3 pt-1">
                          <button 
                            className="flex items-center gap-1 text-caption font-semibold text-muted-foreground hover:text-primary spring-fast bg-transparent border-0 cursor-pointer" 
                            onClick={() => {
                              const authorObj = getUser(c.authorId)
                              if (authorObj) {
                                setCommentText(prev => `@${authorObj.username} ` + prev)
                                setTimeout(() => document.getElementById('comment-input')?.focus(), 50)
                              }
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                            {i18n.t('task.comments.reply')}
                          </button>
                          {isOwner && (
                            <>
                              <button className="flex items-center gap-1 text-caption font-semibold text-muted-foreground hover:text-primary spring-fast bg-transparent border-0 cursor-pointer" onClick={() => { setEditingId(c.id); setEditText(c.content) }}>
                                <Edit3 className="h-3 w-3" />{i18n.t('edit')}
                              </button>
                              <button className="flex items-center gap-1 text-caption font-semibold text-destructive hover:text-destructive/80 spring-fast bg-transparent border-0 cursor-pointer" onClick={() => setDeleteConfirm(c.id)}>
                                <Trash2 className="h-3 w-3" />{i18n.t('delete')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t('task_detail.delete_comment')}</DialogTitle>
            <DialogDescription>{i18n.t('task_detail.delete_comment_desc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="h-9 rounded-full spring-transition">{i18n.t('cancel')}</Button>
            <Button variant="danger" onClick={() => { if (deleteConfirm) handleDeleteComment(deleteConfirm) }} className="h-9 rounded-full spring-transition">{i18n.t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDeleteConfirm} onOpenChange={(o) => { if (!o) setTaskDeleteConfirm(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t('task.delete_confirm')}</DialogTitle>
            <DialogDescription>{i18n.t('task.delete_confirm_desc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setTaskDeleteConfirm(false)} className="h-9 rounded-full spring-transition">{i18n.t('cancel')}</Button>
            <Button variant="danger" onClick={async () => { if (id) { await deleteTask(id); navigate('/tasks') } }} className="h-9 rounded-full spring-transition">{i18n.t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showIdleDialog} onOpenChange={setShowIdleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              {i18n.t('task.idle_alert')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              {i18n.t('task.idle_alert_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setShowIdleDialog(false)} className="rounded-xl">
              {i18n.t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
