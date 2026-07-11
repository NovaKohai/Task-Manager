import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Clock, User, CheckCircle2, XCircle, Edit3, Trash2, Send,
} from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useCommentStore } from '@/stores/commentStore'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { priorityBadge, getInitials } from '@/lib/constants'
import type { TaskStatus } from '@/lib/types'

function formatFull(d: string): string {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTask, isLoading: taskLoading, fetchTask, updateTask, deleteTask } = useTaskStore()
  const { comments, isLoading: commentLoading, fetchComments, addComment, editComment, deleteComment } = useCommentStore()
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUserStore()

  const [commentText, setCommentText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [taskDeleteConfirm, setTaskDeleteConfirm] = useState(false)
  const [qaSuccess, setQaSuccess] = useState(false)

  useEffect(() => { if (id) { fetchTask(id); fetchComments(id); fetchUsers() } }, [id, fetchTask, fetchComments, fetchUsers])

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

  async function handleRequestReview() {
    if (!id || !user || !t) return
    db.addNotification({
      userId: t.creatorId,
      type: 'qa_review',
      title: 'طلب مراجعة جودة',
      message: `طلب الموظف ${user.name} مراجعة الكود/التصميم الخاص بمهمة [${t.title}]`,
      taskId: t.id,
      read: false
    })
    setQaSuccess(true)
    setTimeout(() => setQaSuccess(false), 3000)
  }

  const getUserName = useCallback((userId: string): string => {
    return users.find(u => u.id === userId)?.name || 'Unknown'
  }, [users])

  const statusTransitions = useMemo(() => [
    { from: ['todo'] as TaskStatus[], to: 'in_progress' as TaskStatus, label: 'Start', variant: 'primary' as const },
    { from: ['in_progress'] as TaskStatus[], to: 'done' as TaskStatus, label: i18n.t('task.complete'), variant: 'success' as const },
    { from: ['todo', 'in_progress'] as TaskStatus[], to: 'cancelled' as TaskStatus, label: i18n.t('task.cancel'), variant: 'danger' as const },
  ], [])

  if (taskLoading || !currentTask) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const t = currentTask

  return (
    <div className="space-y-5 page-bg">
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
            <div className="flex gap-2 shrink-0">
              <span className={cn('text-caption font-semibold px-2.5 py-0.5 rounded-full', priorityBadge[t.priority].variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>{i18n.t(`priority.${t.priority}`)}</span>
              <span className="text-caption font-semibold px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{i18n.t(`task.status.${t.status}`)}</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground/80 max-w-prose">{t.description || 'No description'}</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.assignee')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><User className="h-3 w-3 shrink-0 text-primary" />{t.assigneeId ? getUserName(t.assigneeId) : 'Unassigned'}</p>
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
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('task.created')}</Label>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Calendar className="h-3 w-3 shrink-0 text-primary" />{formatFull(t.createdAt)}</p>
            </div>
          </div>

          {t.project && (
            <div className="bg-muted/20 rounded-xl p-3 border border-border/10 inline-block">
              <Label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60">Project</Label>
              <p className="mt-0.5 text-sm font-semibold">{t.project}</p>
            </div>
          )}

          {qaSuccess && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-500 font-bold border">
              {i18n.t('notifications.qa_success')}
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
              <Button variant="secondary" size="sm" onClick={handleRequestReview} className="h-8 rounded-full text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 spring-transition">
                {i18n.t('notifications.qa_request')}
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Acceptance Criteria</h2>
          <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground/60">
            No acceptance criteria defined
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="glass-panel animate-rise stagger-4">
        <div className="glass-panel-inner">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">Comments ({comments.length})</h2>

          <div className="flex gap-2 mb-5">
            <Input aria-label={i18n.t('comment.placeholder')} placeholder={i18n.t('comment.placeholder')} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition flex-1" maxLength={2000} />
            <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()} className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 spring-transition">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {commentLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{i18n.t('comment.no_comments')}</p>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{getUserName(c.authorId)}</span>
                        <span className="text-caption text-muted-foreground font-mono">{formatFull(c.createdAt)}</span>
                        {c.editedAt && <span className="text-caption text-muted-foreground/60">(edited)</span>}
                      </div>
                      {editingId === c.id ? (
                        <div className="flex gap-2">
                          <Input aria-label={i18n.t('edit')} value={editText} onChange={(e) => setEditText(e.target.value)} className="h-8 text-sm rounded-xl bg-background/50 flex-1 spring-transition" />
                          <Button size="sm" onClick={() => handleEditComment(c.id)} className="h-8 text-xs rounded-full spring-transition">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs rounded-full spring-transition">Cancel</Button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/80">{c.content}</p>
                      )}
                      {isOwner && editingId !== c.id && (
                        <div className="flex gap-3 pt-1">
                          <button className="flex items-center gap-1 text-caption font-semibold text-muted-foreground hover:text-primary spring-fast bg-transparent border-0 cursor-pointer" onClick={() => { setEditingId(c.id); setEditText(c.content) }}>
                            <Edit3 className="h-3 w-3" />{i18n.t('edit')}
                          </button>
                          <button className="flex items-center gap-1 text-caption font-semibold text-destructive hover:text-destructive/80 spring-fast bg-transparent border-0 cursor-pointer" onClick={() => setDeleteConfirm(c.id)}>
                            <Trash2 className="h-3 w-3" />{i18n.t('delete')}
                          </button>
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
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this comment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="h-9 rounded-full spring-transition">Cancel</Button>
            <Button variant="danger" onClick={() => { if (deleteConfirm) handleDeleteComment(deleteConfirm) }} className="h-9 rounded-full spring-transition">Delete</Button>
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
    </div>
  )
}
