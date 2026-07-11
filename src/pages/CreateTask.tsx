import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { i18n } from '@/lib/i18n'
import type { Priority } from '@/lib/types'

export default function CreateTask() {
  const navigate = useNavigate()
  const { createTask, isLoading } = useTaskStore()
  const { users, fetchUsers } = useUserStore()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estHours, setEstHours] = useState('')
  const [project, setProject] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) e.dueDate = 'Due date must be in the future'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !user) return
    await createTask({
      title: title.trim(), description, status: 'todo', priority,
      assigneeId: assigneeId || null, creatorId: user.id,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estHours: estHours ? Number(estHours) : null,
      project: project || undefined,
    })
    navigate('/tasks')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 page-bg">
      <div className="flex items-center gap-3 animate-rise stagger-1">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 rounded-full hover:bg-muted/40 spring-transition">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight">{i18n.t('task.create')}</h1>
      </div>

      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold">{i18n.t('task.title')} *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={200} />
              {errors.title && <p className="flex items-center gap-1 text-xs text-destructive font-semibold"><AlertTriangle className="h-3 w-3" />{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">{i18n.t('task.description')}</Label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter task description" rows={4} maxLength={5000}
                className="flex w-full rounded-xl border border-input/60 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring spring-transition" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">{i18n.t('task.priority')}</Label>
              <div className="flex flex-wrap gap-2">
                {(['low', 'medium', 'high', 'critical'] as Priority[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold spring-fast ${
                      priority === p ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border/40 hover:bg-accent text-muted-foreground'
                    }`}>
                    {i18n.t(`priority.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-sm font-bold">{i18n.t('task.assignee')}</Label>
                <Select aria-label={i18n.t('task.assignee')} value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="assignee" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Unassigned</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-bold">{i18n.t('task.due_date')}</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                {errors.dueDate && <p className="flex items-center gap-1 text-xs text-destructive font-semibold"><AlertTriangle className="h-3 w-3" />{errors.dueDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estHours" className="text-sm font-bold">{i18n.t('task.est_hours')}</Label>
                <Input id="estHours" type="number" min="0" step="0.5" value={estHours} onChange={(e) => setEstHours(e.target.value)} placeholder="e.g. 4" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-bold">Project</Label>
                <Input id="project" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Frontend" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={100} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="h-10 rounded-full spring-transition px-5">{i18n.t('cancel')}</Button>
                <Button type="submit" disabled={isLoading} className="h-10 rounded-full spring-transition px-5 font-semibold">
                <Save className="h-4 w-4" />
                {i18n.t('task.create')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
