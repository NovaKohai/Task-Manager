import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pause, Play, Square, RotateCcw, Coffee, Target, History } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { i18n } from '@/lib/i18n'
import { durationLabel, minutesBetween, formatClock, isoToday } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/lib/types'

type Mode = 'focus' | 'break'

interface Draft {
  kind: Mode
  startedAt: number
  pausedAccumMs: number
  pausedAt: number | null
}

export default function Focus() {
  const navigate = useNavigate()
  const { taskId } = useParams<{ taskId?: string }>()
  const { tasks, fetchTasks } = useTaskStore()
  const { user } = useAuthStore()

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const task = useMemo(() => taskId ? db.getTask(taskId) : null, [taskId])

  const preferences = useUserPreferencesStore(s => s.preferences)
  const fetchPreferences = useUserPreferencesStore(s => s.fetchPreferences)
  useEffect(() => { fetchPreferences() }, [fetchPreferences])
  const [mode, setMode] = useState<Mode>('focus')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [, forceTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const [recent, setRecent] = useState<TimeEntry[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId ?? null)

  useEffect(() => {
    if (!user) return
    setRecent(db.getTimeEntries({ userId: user.id, sinceISO: new Date(Date.now() - 7 * 86400000).toISOString() }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tasks.length])

  const targetMinutes = mode === 'focus' ? (preferences?.workDurationMin ?? 25) : (preferences?.shortBreakMin ?? 5)

  function elapsedMinutes(): number {
    if (!draft) return 0
    const running = draft.pausedAt == null
    const fromRunning = running ? Date.now() - draft.startedAt - draft.pausedAccumMs : draft.pausedAccumMs
    return Math.floor(fromRunning / 60000)
  }

  const elapsed = elapsedMinutes()
  const remaining = Math.max(0, targetMinutes - elapsed)
  const progressPct = Math.min(100, Math.round((elapsed / targetMinutes) * 100))

  useEffect(() => {
    if (!draft) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    if (draft.pausedAt != null) return
    intervalRef.current = setInterval(() => forceTick((v) => v + 1), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [draft])

  useEffect(() => {
    if (draft && remaining <= 0) {
      playChime()
      handleStop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, draft?.startedAt])

  function playChime() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch (e) {
      console.warn('Chime failed', e)
    }
  }

  function handleStart() {
    if (draft) return
    if (mode === 'focus' && !selectedTaskId) return
    setDraft({ kind: mode, startedAt: Date.now(), pausedAccumMs: 0, pausedAt: null })
  }

  function handlePause() {
    if (!draft || draft.pausedAt != null) return
    setDraft({ ...draft, pausedAt: Date.now() })
  }

  function handleResume() {
    if (!draft || draft.pausedAt == null) return
    const added = Date.now() - draft.pausedAt
    setDraft({ ...draft, pausedAccumMs: draft.pausedAccumMs + added, pausedAt: null })
  }

  function handleStop() {
    if (!draft) return
    const endedAt = Date.now()
    const minutes = minutesBetween(new Date(draft.startedAt), new Date(endedAt))
    if (minutes > 0) {
      const entry = db.addTimeEntry({
        taskId: selectedTaskId ?? '',
        userId: user!.id,
        startedAt: new Date(draft.startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        durationMinutes: minutes,
        kind: draft.kind,
      })
      setRecent((r) => [entry, ...r])
    }
    setDraft(null)
  }

  function handleReset() {
    setDraft(null)
  }

  function selectTaskForFocus(id: string) {
    if (draft) return
    setSelectedTaskId(id || null)
  }

  const userTaskTotals = user
    ? db.totalMinutesByAssignee({ userId: user.id, sinceISO: new Date(Date.now() - 7 * 86400000).toISOString() })
    : new Map<string, number>()

  const todayMinutes = useMemo(() => {
    return recent
      .filter(r => r.kind === 'focus' && r.startedAt.slice(0, 10) === isoToday())
      .reduce((sum, r) => sum + r.durationMinutes, 0)
  }, [recent])

  if (!user) return null

  const isRunning = draft != null && draft.pausedAt == null
  const isPaused = draft != null && draft.pausedAt != null

  const totalMinutes = userTaskTotals.get(user.id) ?? 0

  return (
    <div className="space-y-8 page-bg">
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 rounded-full hover:bg-muted/40 spring-transition">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('focus.title')}</h1>
        </div>
        <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/10">
          <button
            onClick={() => { if (!draft) setMode('focus') }}
            aria-pressed={mode === 'focus'}
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 text-xs font-bold rounded-lg spring-fast cursor-pointer',
              mode === 'focus' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Target className="h-3 w-3" /> {i18n.t('focus.mode_focus')}
          </button>
          <button
            onClick={() => { if (!draft) setMode('break') }}
            aria-pressed={mode === 'break'}
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 text-xs font-bold rounded-lg spring-fast cursor-pointer',
              mode === 'break' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Coffee className="h-3 w-3" /> {i18n.t('focus.mode_break')}
          </button>
        </div>
      </div>

      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner flex flex-col items-center gap-5 py-10">
          {!draft && mode === 'focus' && (
            <select
              value={selectedTaskId ?? ''}
              onChange={(e) => selectTaskForFocus(e.target.value)}
              className="h-9 rounded-xl bg-background/50 border border-border/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[280px]"
            >
              <option value="">{i18n.t('focus.select_task')}</option>
              {tasks.filter(t => !t.parentTaskId && t.status !== 'done' && t.status !== 'cancelled').map(t => (
                <option key={t.id} value={t.id}>{t.code} — {t.title}</option>
              ))}
            </select>
          )}

          {draft && (
            <p className="text-xs text-muted-foreground font-mono">
              {task ? `${task.code} — ${task.title}` : i18n.t('focus.mode_break')}
            </p>
          )}

          <div
            role="timer"
            aria-live="polite"
            aria-label={i18n.t('focus.timer_aria').replace('{minutes}', String(remaining))}
            className="relative h-56 w-56"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="currentColor"
                className="text-primary spring-slow"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={(2 * Math.PI * 44) * (1 - progressPct / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-black tabular-nums tracking-tighter text-foreground">
                {formatClock(remaining)}
              </span>
              <span className="text-caption uppercase tracking-widest text-muted-foreground mt-1">
                {isRunning ? i18n.t('focus.running') : isPaused ? i18n.t('focus.paused') : i18n.t('focus.idle')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!draft && (
              <Button
                onClick={handleStart}
                disabled={mode === 'focus' && !selectedTaskId}
                className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-sm font-bold gap-2 spring-transition shadow-lg shadow-primary/20"
              >
                <Play className="h-4 w-4" />
                {i18n.t('focus.start')}
              </Button>
            )}
            {draft && isRunning && (
              <Button variant="secondary" onClick={handlePause} className="h-12 px-6 rounded-full text-sm font-bold gap-2 spring-transition">
                <Pause className="h-4 w-4" />
                {i18n.t('focus.pause')}
              </Button>
            )}
            {draft && isPaused && (
              <Button onClick={handleResume} className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-sm font-bold gap-2 spring-transition shadow-lg shadow-primary/20">
                <Play className="h-4 w-4" />
                {i18n.t('focus.resume')}
              </Button>
            )}
            {draft && (
              <Button variant="danger" onClick={handleStop} className="h-12 px-6 rounded-full text-sm font-bold gap-2 spring-transition">
                <Square className="h-4 w-4" />
                {i18n.t('focus.stop')}
              </Button>
            )}
          </div>

          {draft && (
            <Button variant="ghost" onClick={handleReset} className="text-caption text-muted-foreground hover:text-foreground spring-fast gap-1">
              <RotateCcw className="h-3 w-3" />
              {i18n.t('focus.discard')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 animate-rise stagger-3">
        <div className="glass-panel">
          <div className="glass-panel-inner text-center py-4">
            <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">{i18n.t('focus.today_minutes')}</p>
            <p className="text-2xl font-black mt-1 tabular-nums">{durationLabel(todayMinutes)}</p>
          </div>
        </div>
        <div className="glass-panel">
          <div className="glass-panel-inner text-center py-4">
            <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">{i18n.t('focus.total_minutes')}</p>
            <p className="text-2xl font-black mt-1 tabular-nums">{durationLabel(totalMinutes)}</p>
          </div>
        </div>
        <div className="glass-panel">
          <div className="glass-panel-inner text-center py-4">
            <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">{i18n.t('focus.total_sessions')}</p>
            <p className="text-2xl font-black mt-1 tabular-nums">{recent.filter(r => r.kind === 'focus').length}</p>
          </div>
        </div>
      </div>

      {taskId && task && (
        <div className="glass-panel animate-rise stagger-4">
          <div className="glass-panel-inner">
            <Link to={`/tasks/${task.id}`} className="flex items-center justify-between gap-2 text-sm font-semibold hover:text-primary spring-fast">
              <span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> {task.title}</span>
              <span className="text-caption text-muted-foreground font-mono">{task.code}</span>
            </Link>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="glass-panel animate-rise stagger-4">
          <div className="glass-panel-inner">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              {i18n.t('focus.recent_sessions')}
            </h2>
            <ul className="space-y-1.5">
              {recent.slice(0, 8).map(r => {
                const linkTask = db.getTask(r.taskId)
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/20 spring-fast text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.kind === 'focus' ? <Target className="h-3 w-3 text-primary shrink-0" /> : <Coffee className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <span className="truncate">{linkTask ? linkTask.title : i18n.t('focus.mode_break')}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-caption text-muted-foreground/60 font-mono">{new Date(r.startedAt).toLocaleString()}</span>
                      <span className="text-caption font-bold tabular-nums">{durationLabel(r.durationMinutes)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <p className="text-caption text-muted-foreground/60 text-center animate-rise stagger-4">
          {i18n.t('focus.no_sessions_yet')}
        </p>
      )}
    </div>
  )
}
