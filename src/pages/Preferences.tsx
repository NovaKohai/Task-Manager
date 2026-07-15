import { useEffect, useState } from 'react'
import { Save, Volume2 } from 'lucide-react'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { useAuthStore } from '@/stores/authStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { hasPermission } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import { soundSynthesizer } from '@/lib/sound'
import type { UserPreferences } from '@/lib/types'

export default function Preferences() {
  useLocaleStore(s => s.lang)
  const { preferences, isLoading, saved, fetchPreferences, updatePreferences } = useUserPreferencesStore()
  const { toast } = useToast()
  const [form, setForm] = useState<Partial<UserPreferences>>({})

  useEffect(() => { fetchPreferences() }, [fetchPreferences])
  useEffect(() => { if (preferences) setForm({ ...preferences }) }, [preferences])
  useEffect(() => { if (saved) toast({ description: i18n.t('settings.saved'), variant: 'success' }) }, [saved, toast])

  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user, 'preferences.edit')

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!canEdit) return
    await updatePreferences(form)
  }

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      <h1 className="text-lg font-bold tracking-tight text-foreground animate-rise stagger-1">{i18n.t('preferences.title')}</h1>
      <p className="text-caption text-muted-foreground/90 animate-rise stagger-1 max-w-prose">{i18n.t('preferences.desc')}</p>

      <div className="space-y-5 animate-rise stagger-2">
        {/* Notifications */}
        <div className="glass-panel">
          <div className="glass-panel-inner space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i18n.t('settings.notifications')}</h2>
            {([
              { key: 'enableEmailNotif' as const, label: () => i18n.t('settings.email_notifications'), help: 'settings.enableEmailNotif.help' },
              { key: 'enablePushNotif' as const, label: () => i18n.t('settings.push_notifications'), help: 'settings.enablePushNotif.help' },
              { key: 'enableSlackNotif' as const, label: () => i18n.t('settings.slack_integration'), help: 'settings.enableSlackNotif.help' },
              { key: 'enableDigest' as const, label: () => i18n.t('settings.daily_digest'), help: 'settings.enableDigest.help' },
            ] as const).map((n) => (
              <div key={n.key} className="space-y-1">
                <div className="flex items-center gap-3">
                  <Switch id={n.key} checked={form[n.key] ?? false} onCheckedChange={(v) => update(n.key, v)} disabled={!canEdit} />
                  <Label htmlFor={n.key} className="text-sm font-bold">{n.label()}</Label>
                </div>
                <p className="text-caption text-muted-foreground/90 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t(n.help)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="glass-panel">
          <div className="glass-panel-inner space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i18n.t('settings.sound_notifications')}</h2>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Switch id="enableSoundNotif" checked={form.enableSoundNotif ?? false} onCheckedChange={(v) => update('enableSoundNotif', v)} disabled={!canEdit} />
                <Label htmlFor="enableSoundNotif" className="text-sm font-bold">{i18n.t('settings.sound_notifications')}</Label>
              </div>
              <p className="text-caption text-muted-foreground/90 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t('settings.enableSoundNotif.help')}</p>
            </div>

            {(form.enableSoundNotif ?? false) && (
              <div className="grid gap-4 sm:grid-cols-2 pl-11 rtl:pr-11 rtl:pl-0 animate-rise stagger-1">
                <div className="space-y-2">
                  <Label htmlFor="soundNotifTheme" className="text-sm font-bold">{i18n.t('settings.sound_theme')}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select aria-label={i18n.t('settings.sound_theme')} value={form.soundNotifTheme ?? 'chime'} onValueChange={(v) => update('soundNotifTheme', v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chime">{i18n.t('settings.sound_theme.chime')}</SelectItem>
                          <SelectItem value="glass">{i18n.t('settings.sound_theme.glass')}</SelectItem>
                          <SelectItem value="cyber">{i18n.t('settings.sound_theme.cyber')}</SelectItem>
                          <SelectItem value="alert">{i18n.t('settings.sound_theme.alert')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      onClick={() => soundSynthesizer.play(form.soundNotifTheme ?? 'chime', form.soundNotifVolume ?? 0.5)}
                      className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center spring-transition"
                      title={i18n.t('settings.sound_test')}
                    >
                      <Volume2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="soundNotifVolume" className="text-sm font-bold">{i18n.t('settings.sound_volume')}</Label>
                    <span className="text-caption font-mono text-muted-foreground">{Math.round((form.soundNotifVolume ?? 0.5) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3 h-10">
                    <input
                      id="soundNotifVolume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.soundNotifVolume ?? 0.5}
                      onChange={(e) => update('soundNotifVolume', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="glass-panel">
          <div className="glass-panel-inner space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i18n.t('preferences.quiet_hours')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart" className="text-sm font-bold">{i18n.t('settings.quietHoursStart')}</Label>
                <Input id="quietHoursStart" type="time" value={form.quietHoursStart ?? '22:00'} onChange={(e) => update('quietHoursStart', e.target.value)} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                <p className="text-caption text-muted-foreground/90 mt-1 leading-normal">{i18n.t('settings.quietHoursStart.help')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd" className="text-sm font-bold">{i18n.t('settings.quietHoursEnd')}</Label>
                <Input id="quietHoursEnd" type="time" value={form.quietHoursEnd ?? '07:00'} onChange={(e) => update('quietHoursEnd', e.target.value)} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                <p className="text-caption text-muted-foreground/90 mt-1 leading-normal">{i18n.t('settings.quietHoursEnd.help')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="glass-panel">
          <div className="glass-panel-inner space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i18n.t('preferences.display')}</h2>
            <div className="space-y-1">
              <Label htmlFor="fontSize" className="text-sm font-bold">{i18n.t('preferences.font_size')}</Label>
              <Select aria-label={i18n.t('preferences.font_size')} value={form.fontSize ?? 'medium'} onValueChange={(v) => update('fontSize', v as 'small' | 'medium' | 'large')}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{i18n.t('preferences.font_size.small')}</SelectItem>
                  <SelectItem value="medium">{i18n.t('preferences.font_size.medium')}</SelectItem>
                  <SelectItem value="large">{i18n.t('preferences.font_size.large')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Switch id="compactMode" checked={form.compactMode ?? false} onCheckedChange={(v) => update('compactMode', v)} disabled={!canEdit} />
                <Label htmlFor="compactMode" className="text-sm font-bold">{i18n.t('preferences.compact_mode')}</Label>
              </div>
              <p className="text-caption text-muted-foreground/90 leading-normal pl-11 rtl:pr-11 rtl:pl-0">{i18n.t('preferences.compact_mode.help')}</p>
            </div>
          </div>
        </div>

        {/* Focus Timer */}
        <div className="glass-panel">
          <div className="glass-panel-inner space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i18n.t('focus.title')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workDurationMin" className="text-sm font-bold">{i18n.t('settings.focus.work_duration')}</Label>
                <Input id="workDurationMin" type="number" value={form.workDurationMin ?? 25} onChange={(e) => update('workDurationMin', Number(e.target.value))} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortBreakMin" className="text-sm font-bold">{i18n.t('settings.focus.short_break')}</Label>
                <Input id="shortBreakMin" type="number" value={form.shortBreakMin ?? 5} onChange={(e) => update('shortBreakMin', Number(e.target.value))} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="longBreakMin" className="text-sm font-bold">{i18n.t('settings.focus.long_break')}</Label>
                <Input id="longBreakMin" type="number" value={form.longBreakMin ?? 15} onChange={(e) => update('longBreakMin', Number(e.target.value))} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longBreakInterval" className="text-sm font-bold">{i18n.t('settings.focus.long_break_interval')}</Label>
                <Input id="longBreakInterval" type="number" value={form.longBreakInterval ?? 4} onChange={(e) => update('longBreakInterval', Number(e.target.value))} disabled={!canEdit} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canEdit} className="h-10 rounded-full spring-transition font-semibold px-5">
          <Save className="h-4 w-4" />{i18n.t('settings.save')}
        </Button>
      </div>
    </div>
  )
}
