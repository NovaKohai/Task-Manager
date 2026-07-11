import { useEffect, useState, useRef } from 'react'
import { Save, AlertTriangle, RotateCcw, RefreshCw, ArrowUpCircle, CheckCircle2, XCircle, Download } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUpdateStore } from '@/stores/updateStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { i18n } from '@/lib/i18n'

import type { AppSettings } from '@/lib/types'

type Section = 'general' | 'security' | 'sessions' | 'notifications' | 'data' | 'ratelimit' | 'updates'

const sections: { id: Section; label: string }[] = [
  { id: 'general', label: i18n.t('settings.general') },
  { id: 'security', label: i18n.t('settings.security') },
  { id: 'sessions', label: i18n.t('settings.sessions') },
  { id: 'notifications', label: i18n.t('settings.notifications') },
  { id: 'data', label: i18n.t('settings.data') },
  { id: 'ratelimit', label: i18n.t('settings.ratelimit') },
  { id: 'updates', label: i18n.t('settings.updates') },
]

export default function Settings() {
  const { settings, isLoading, saved, fetchSettings, updateSettings, resetSettings } = useSettingsStore()
  const [activeSection, setActiveSection] = useState<Section>('general')
  const [form, setForm] = useState<Partial<AppSettings>>({})
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])
  const toastId = useRef(0)
  const updateStatus = useUpdateStore(s => s.status)
  const updateInfo = useUpdateStore(s => s.info)
  const updateVersion = useUpdateStore(s => s.version)
  const updateProgress = useUpdateStore(s => s.progress)
  const updateError = useUpdateStore(s => s.error)
  const checkUpdates = useUpdateStore(s => s.check)
  const downloadUpdate = useUpdateStore(s => s.download)
  const installUpdate = useUpdateStore(s => s.install)

  useEffect(() => { fetchSettings() }, [fetchSettings])
  useEffect(() => { if (settings) setForm({ ...settings }) }, [settings])
  useEffect(() => { if (saved) showToast(i18n.t('settings.saved')) }, [saved])

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() { await updateSettings(form) }

  async function handleCheckUpdates() { await checkUpdates() }
  async function handleDownloadUpdate() { await downloadUpdate() }
  function handleInstallUpdate() { installUpdate() }

  const user = useAuthStore((s) => s.user)

  function showToast(message: string) {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      <h1 className="text-lg font-bold tracking-tight text-foreground animate-rise stagger-1">{i18n.t('settings.title')}</h1>

      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 animate-rise stagger-1">
          {toasts.map(t => (
            <div key={t.id} className="glass-panel !p-3 text-xs text-emerald-500 font-bold border border-emerald-500/20">
              <div className="glass-panel-inner !p-0">{t.message}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row animate-rise stagger-2">
        <nav className="flex shrink-0 gap-1 overflow-x-auto bg-muted/40 p-1.5 rounded-2xl border border-border/10 lg:w-44 lg:flex-col h-fit">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn('rounded-full px-3 py-2 text-left text-xs font-semibold spring-fast whitespace-nowrap', activeSection === s.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-5">
          {activeSection === 'general' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.general')}</h2>
                <div className="space-y-2">
                  <Label htmlFor="srvServerName" className="text-sm font-bold">{i18n.t('settings.serverName')}</Label>
                  <Input id="srvServerName" value={form.serverName || ''} onChange={(e) => update('serverName', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                  <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.serverName.help')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srvTimezone" className="text-sm font-bold">{i18n.t('settings.timezone')}</Label>
                  <Input id="srvTimezone" value={form.defaultTimezone || ''} onChange={(e) => update('defaultTimezone', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                  <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.timezone.help')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srvAppUrl" className="text-sm font-bold">{i18n.t('settings.appUrl')}</Label>
                  <Input id="srvAppUrl" value={form.appUrl || ''} onChange={(e) => update('appUrl', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                  <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.appUrl.help')}</p>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.security')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvPwMinLen" className="text-sm font-bold">{i18n.t('settings.pwMinLength')}</Label>
                    <Input id="srvPwMinLen" type="number" value={form.pwMinLength ?? 8} onChange={(e) => update('pwMinLength', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.pwMinLength.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvPwMaxLen" className="text-sm font-bold">{i18n.t('settings.pwMaxLength')}</Label>
                    <Input id="srvPwMaxLen" type="number" value={form.pwMaxLength ?? 128} onChange={(e) => update('pwMaxLength', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.pwMaxLength.help')}</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch id="srvReqUpper" checked={form.requireUppercase ?? true} onCheckedChange={(v) => update('requireUppercase', v)} />
                    <Label htmlFor="srvReqUpper" className="text-sm font-bold">{i18n.t('settings.requireUppercase')}</Label>
                  </div>
                  <p className="text-caption text-muted-foreground/80 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t('settings.requireUppercase.help')}</p>
                  
                  <div className="flex items-center gap-3">
                    <Switch id="srvReqDigit" checked={form.requireDigit ?? true} onCheckedChange={(v) => update('requireDigit', v)} />
                    <Label htmlFor="srvReqDigit" className="text-sm font-bold">{i18n.t('settings.requireDigit')}</Label>
                  </div>
                  <p className="text-caption text-muted-foreground/80 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t('settings.requireDigit.help')}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvPwHistory" className="text-sm font-bold">{i18n.t('settings.pwHistory')}</Label>
                    <Input id="srvPwHistory" type="number" value={form.pwHistory ?? 10} onChange={(e) => update('pwHistory', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.pwHistory.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvPwMaxAge" className="text-sm font-bold">{i18n.t('settings.pwMaxAge')}</Label>
                    <Input id="srvPwMaxAge" type="number" value={form.pwMaxAge ?? 90} onChange={(e) => update('pwMaxAge', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.pwMaxAge.help')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srvHashAlgo" className="text-sm font-bold">{i18n.t('settings.pwHashAlgo')}</Label>
                  <Input id="srvHashAlgo" value={form.pwHashAlgo || ''} onChange={(e) => update('pwHashAlgo', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                  <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.pwHashAlgo.help')}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvLockMax" className="text-sm font-bold">{i18n.t('settings.lockMaxAttempts')}</Label>
                    <Input id="srvLockMax" type="number" value={form.lockMaxAttempts ?? 5} onChange={(e) => update('lockMaxAttempts', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.lockMaxAttempts.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvLockDur" className="text-sm font-bold">{i18n.t('settings.lockDuration')}</Label>
                    <Input id="srvLockDur" type="number" value={form.lockDuration ?? 15} onChange={(e) => update('lockDuration', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.lockDuration.help')}</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>
              </div>
            </div>
          )}

          {activeSection === 'sessions' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.sessions')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvAccessToken" className="text-sm font-bold">{i18n.t('settings.accessTokenExpiry')}</Label>
                    <Input id="srvAccessToken" type="number" value={form.accessTokenExpiry ?? 15} onChange={(e) => update('accessTokenExpiry', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.accessTokenExpiry.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvRefreshToken" className="text-sm font-bold">{i18n.t('settings.refreshTokenExpiry')}</Label>
                    <Input id="srvRefreshToken" type="number" value={form.refreshTokenExpiry ?? 7} onChange={(e) => update('refreshTokenExpiry', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.refreshTokenExpiry.help')}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvInactTimeout" className="text-sm font-bold">{i18n.t('settings.inactivityTimeout')}</Label>
                    <Input id="srvInactTimeout" type="number" value={form.inactivityTimeout ?? 15} onChange={(e) => update('inactivityTimeout', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.inactivityTimeout.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvMaxConcur" className="text-sm font-bold">{i18n.t('settings.maxConcurrentSessions')}</Label>
                    <Input id="srvMaxConcur" type="number" value={form.maxConcurrentSessions ?? 5} onChange={(e) => update('maxConcurrentSessions', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.maxConcurrentSessions.help')}</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.notifications')}</h2>
                {([
                  { key: 'enableEmailNotif' as const, label: () => i18n.t('settings.email_notifications'), help: 'settings.enableEmailNotif.help' },
                  { key: 'enablePushNotif' as const, label: () => i18n.t('settings.push_notifications'), help: 'settings.enablePushNotif.help' },
                  { key: 'enableSlackNotif' as const, label: () => i18n.t('settings.slack_integration'), help: 'settings.enableSlackNotif.help' },
                  { key: 'enableDigest' as const, label: () => i18n.t('settings.daily_digest'), help: 'settings.enableDigest.help' },
                ] as const).map((n) => (
                  <div key={n.key} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Switch id={n.key} checked={form[n.key] ?? false} onCheckedChange={(v) => update(n.key, v)} />
                      <Label htmlFor={n.key} className="text-sm font-bold">{n.label()}</Label>
                    </div>
                    <p className="text-caption text-muted-foreground/80 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t(n.help)}</p>
                  </div>
                ))}
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvQuietStart" className="text-sm font-bold">{i18n.t('settings.quietHoursStart')}</Label>
                    <Input id="srvQuietStart" type="time" value={form.quietHoursStart ?? '22:00'} onChange={(e) => update('quietHoursStart', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.quietHoursStart.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvQuietEnd" className="text-sm font-bold">{i18n.t('settings.quietHoursEnd')}</Label>
                    <Input id="srvQuietEnd" type="time" value={form.quietHoursEnd ?? '07:00'} onChange={(e) => update('quietHoursEnd', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.quietHoursEnd.help')}</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.data')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvRetention" className="text-sm font-bold">{i18n.t('settings.retentionDays')}</Label>
                    <Input id="srvRetention" type="number" value={form.retentionDays ?? 365} onChange={(e) => update('retentionDays', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.retentionDays.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvSoftDel" className="text-sm font-bold">{i18n.t('settings.softDeleteDays')}</Label>
                    <Input id="srvSoftDel" type="number" value={form.softDeleteDays ?? 90} onChange={(e) => update('softDeleteDays', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.softDeleteDays.help')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srvAuditRet" className="text-sm font-bold">{i18n.t('settings.auditRetentionDays')}</Label>
                  <Input id="srvAuditRet" type="number" value={form.auditRetentionDays ?? 365} onChange={(e) => update('auditRetentionDays', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                  <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.auditRetentionDays.help')}</p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch id="srvEnableBackup" checked={form.enableBackup ?? true} onCheckedChange={(v) => update('enableBackup', v)} />
                    <Label htmlFor="srvEnableBackup" className="text-sm font-bold">{i18n.t('settings.enableBackup')}</Label>
                  </div>
                  <p className="text-caption text-muted-foreground/80 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t('settings.enableBackup.help')}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvBackupCount" className="text-sm font-bold">{i18n.t('settings.backupCount')}</Label>
                    <Input id="srvBackupCount" type="number" value={form.backupCount ?? 30} onChange={(e) => update('backupCount', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.backupCount.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvBackupPath" className="text-sm font-bold">{i18n.t('settings.backupPath')}</Label>
                    <Input id="srvBackupPath" value={form.backupPath || ''} onChange={(e) => update('backupPath', e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.backupPath.help')}</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>

              </div>
            </div>
          )}

          {activeSection === 'ratelimit' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.ratelimit')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="srvAuthRate" className="text-sm font-bold">{i18n.t('settings.authRateLimit')}</Label>
                    <Input id="srvAuthRate" type="number" value={form.authRateLimit ?? 10} onChange={(e) => update('authRateLimit', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.authRateLimit.help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="srvApiRate" className="text-sm font-bold">{i18n.t('settings.apiRateLimit')}</Label>
                    <Input id="srvApiRate" type="number" value={form.apiRateLimit ?? 1000} onChange={(e) => update('apiRateLimit', Number(e.target.value))} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                    <p className="text-caption text-muted-foreground/80 mt-1 leading-normal">{i18n.t('settings.apiRateLimit.help')}</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition font-semibold px-5"><Save className="h-4 w-4" />{i18n.t('settings.save')}</Button>
              </div>
            </div>
          )}

          {activeSection === 'updates' && (
            <div className="glass-panel animate-rise stagger-3">
              <div className="glass-panel-inner space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{i18n.t('settings.updates')}</h2>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">{i18n.t('settings.updates.desc')}</p>

                {!window.electronAPI && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-500">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {i18n.t('settings.updates_web_only')}
                  </div>
                )}

                {updateStatus === 'idle' && window.electronAPI && (
                  <Button onClick={handleCheckUpdates} className="h-10 rounded-full spring-transition font-semibold px-5">
                    <RefreshCw className="h-4 w-4" />{i18n.t('settings.check_updates')}
                  </Button>
                )}

                {updateStatus === 'checking' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {i18n.t('loading')}
                  </div>
                )}

                {updateStatus === 'uptodate' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {i18n.t('settings.up_to_date')}
                    </div>
                    <p className="text-xs text-muted-foreground/60">{i18n.t('settings.current_version')}: {updateVersion}</p>
                    <Button onClick={handleCheckUpdates} variant="secondary" className="h-9 rounded-full spring-transition text-xs font-semibold px-4">
                      <RefreshCw className="h-3.5 w-3.5" />{i18n.t('settings.check_updates')}
                    </Button>
                  </div>
                )}

                {updateStatus === 'available' && updateInfo && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 p-3 text-xs text-blue-500">
                      <ArrowUpCircle className="h-4 w-4 shrink-0" />
                      {i18n.t('settings.updates_available')} v{updateInfo.version}
                    </div>
                    <p className="text-xs text-muted-foreground/60">{i18n.t('settings.current_version')}: v{updateVersion}</p>
                    {updateInfo.releaseNotes && (
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-background/50 p-3">
                        <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{updateInfo.releaseNotes}</pre>
                      </div>
                    )}
                    <Button onClick={handleDownloadUpdate} className="h-10 rounded-full spring-transition font-semibold px-5">
                      <Download className="h-4 w-4" />{i18n.t('settings.download_update')}
                    </Button>
                  </div>
                )}

                {updateStatus === 'downloading' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {i18n.t('settings.downloading')}
                    </div>
                    {updateProgress > 0 && (
                      <div className="w-full space-y-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-background/50">
                          <div className="h-full rounded-full bg-blue-500 spring-transition" style={{ width: `${updateProgress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground/60">{Math.round(updateProgress)}%</p>
                      </div>
                    )}
                  </div>
                )}

                {updateStatus === 'downloaded' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {i18n.t('settings.update_downloaded')}
                    </div>
                    <Button onClick={handleInstallUpdate} className="h-10 rounded-full spring-transition font-semibold px-5">
                      <ArrowUpCircle className="h-4 w-4" />{i18n.t('settings.install_update')}
                    </Button>
                  </div>
                )}

                {updateStatus === 'done' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {i18n.t('settings.update_success')}
                    </div>
                    <p className="text-xs text-muted-foreground/60">{i18n.t('settings.restart_hint')}</p>
                    <Button onClick={handleCheckUpdates} variant="secondary" className="h-9 rounded-full spring-transition text-xs font-semibold px-4">
                      <RefreshCw className="h-3.5 w-3.5" />{i18n.t('settings.check_updates')}
                    </Button>
                  </div>
                )}

                {updateStatus === 'error' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-500">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {i18n.t('settings.update_error')}
                      {updateError && <span className="text-red-300">: {updateError}</span>}
                    </div>
                    <Button onClick={handleCheckUpdates} variant="secondary" className="h-9 rounded-full spring-transition text-xs font-semibold px-4">
                      <RefreshCw className="h-3.5 w-3.5" />{i18n.t('retry')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="glass-panel border-destructive/30 animate-rise stagger-3">
            <div className="glass-panel-inner space-y-4">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive mb-1">
                <AlertTriangle className="h-4 w-4" />
                {i18n.t('settings.danger_zone')}
              </h2>
              <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4">{i18n.t('settings.danger_desc')}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" onClick={async () => { await resetSettings(); showToast(i18n.t('settings.reset_toast')) }} className="h-9 rounded-full spring-transition text-xs font-semibold px-4">
                  <RotateCcw className="h-3.5 w-3.5" />{i18n.t('settings.reset_defaults')}
                </Button>
                <Button variant="danger" onClick={() => { localStorage.removeItem('ttm_data'); showToast(i18n.t('settings.data_cleared_toast')) }} className="h-9 rounded-full spring-transition text-xs font-semibold px-4">
                  <AlertTriangle className="h-3.5 w-3.5" />{i18n.t('settings.clear_data')}
                </Button>
                <Button variant="danger" onClick={() => { db.clearAuditLog(user?.id, user?.username); showToast(i18n.t('settings.audit_cleared_toast')) }} className="h-9 rounded-full spring-transition text-xs font-bold px-4">
                  {i18n.t('settings.clear_audit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
