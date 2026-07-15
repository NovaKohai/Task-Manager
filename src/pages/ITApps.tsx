import { useState, useMemo, useRef } from 'react'
import {
  Plus, Download, ExternalLink, Image, Camera,
  AlertTriangle, X, Save, Trash2, Edit, PackageOpen,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/utils'
import type { RecommendedApp } from '@/lib/types'

const CATEGORIES = ['creative', 'office', 'developer', 'security', 'communication', 'utilities', 'other'] as const

const categoryVariants: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  creative: 'default',
  office: 'success',
  developer: 'default',
  security: 'danger',
  communication: 'default',
  utilities: 'warning',
  other: 'default',
}

const emptyForm = {
  name: '',
  description: '',
  category: 'other' as string,
  icon: '',
  officialSite: '',
  downloadUrl: '',
  notes: '',
}

type FormData = typeof emptyForm

export default function ITApps() {
  useLocaleStore(s => s.lang)
  const { toast } = useToast()
  const user = useAuthStore(s => s.user)
  const canManage = hasPermission(user, 'it.apps.manage')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apps, setApps] = useState<RecommendedApp[]>(() => db.getRecommendedApps())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RecommendedApp | null>(null)

  const filteredApps = useMemo(() => {
    if (categoryFilter === 'all') return apps
    return apps.filter(a => a.category === categoryFilter)
  }, [apps, categoryFilter])

  function refresh() {
    setApps(db.getRecommendedApps())
  }

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowForm(true)
  }

  function openEdit(app: RecommendedApp) {
    setEditingId(app.id)
    setForm({
      name: app.name,
      description: app.description,
      category: app.category,
      icon: app.icon,
      officialSite: app.officialSite,
      downloadUrl: app.downloadUrl,
      notes: app.notes,
    })
    setFormError('')
    setShowForm(true)
  }

  function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFormError(i18n.t('profile.avatar_too_large'))
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const data = reader.result
      if (typeof data === 'string') setForm(p => ({ ...p, icon: data }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError(i18n.t('it_apps.name') + ' is required'); return }
    setSaving(true)
    try {
      if (editingId) {
        db.updateRecommendedApp(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          icon: form.icon,
          officialSite: form.officialSite.trim(),
          downloadUrl: form.downloadUrl.trim(),
          notes: form.notes.trim(),
        })
      } else {
        db.addRecommendedApp({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          icon: form.icon,
          officialSite: form.officialSite.trim(),
          downloadUrl: form.downloadUrl.trim(),
          notes: form.notes.trim(),
          createdBy: user?.id || '',
        })
      }
      refresh()
      setShowForm(false)
      toast({ description: i18n.t('it_apps.saved'), variant: 'success' })
    } catch {
      setFormError(i18n.t('profile.update_failed'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(app: RecommendedApp) {
    setDeleteTarget(app)
  }

  function executeDelete() {
    if (!deleteTarget) return
    db.deleteRecommendedApp(deleteTarget.id)
    refresh()
    setDeleteTarget(null)
    toast({ description: i18n.t('it_apps.deleted'), variant: 'default' })
  }

  return (
    <div className="space-y-8 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between animate-rise stagger-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('it_apps.title')}</h1>
            <Badge variant="warning" className="rounded-full text-micro px-2 py-0.5">{i18n.t('it_apps.beta_badge')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground/90 mt-1">{i18n.t('it_apps.subtitle')}</p>
        </div>
        {canManage && (
          <Button onClick={openAdd} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20 active:scale-[0.97]">
            <Plus className="h-4 w-4" />
            {i18n.t('it_apps.add')}
          </Button>
        )}
      </div>

      {/* Beta banner */}
      <div className="flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/20 p-3 text-xs text-warning font-medium animate-rise stagger-1">
        <PackageOpen className="h-4 w-4 shrink-0" />
        {i18n.t('it_apps.beta_note')}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 items-center animate-rise stagger-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-caption font-semibold spring-transition border ${
            categoryFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background/50 text-muted-foreground border-border/40 hover:bg-muted/30'
          }`}
        >
          {i18n.t('it_apps.all_categories')}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold spring-transition border ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background/50 text-muted-foreground border-border/40 hover:bg-muted/30'
            }`}
          >
            {i18n.t(`it_apps.category_${cat}`)}
          </button>
        ))}
      </div>

      {/* App cards grid */}
      <div className="animate-rise stagger-3">
        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
              <PackageOpen className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-base font-semibold text-foreground">{i18n.t('it_apps.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{i18n.t('it_apps.empty_desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredApps.map(app => (
              <div key={app.id} className="glass-panel hover:-translate-y-1 spring-transition group">
                <div className="glass-panel-inner p-4 space-y-3">
                  {/* Icon + actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary overflow-hidden">
                      {app.icon ? (
                        <img src={app.icon} alt={app.name} className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-5 w-5" />
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 spring-transition">
                        <button
                          onClick={() => openEdit(app)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground spring-transition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(app)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive spring-transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name + category */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{app.name}</h3>
                    <Badge
                      variant={categoryVariants[app.category] || 'default'}
                      className="rounded-full text-micro px-2 py-0.5 mt-1.5"
                    >
                      {i18n.t(`it_apps.category_${app.category}`)}
                    </Badge>
                  </div>

                  {/* Description */}
                  {app.description && (
                    <p className="text-caption text-muted-foreground/80 line-clamp-2">{app.description}</p>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {app.downloadUrl && (
                      <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-caption font-semibold hover:bg-primary/20 spring-transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {i18n.t('it_apps.download')}
                      </a>
                    )}
                    {app.officialSite && (
                      <a href={app.officialSite} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border/40 text-muted-foreground text-caption font-semibold hover:bg-muted/30 spring-transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {i18n.t('it_apps.visit_site')}
                      </a>
                    )}
                  </div>

                  {/* Notes */}
                  {app.notes && (
                    <p className="text-micro text-muted-foreground/60 border-t border-border/20 pt-2 mt-1">{app.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      {showForm && (
        <div
          className="modal-overlay active"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowForm(false) }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content p-6 max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">
                {editingId ? i18n.t('it_apps.edit') : i18n.t('it_apps.add')}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 spring-fast text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.name')}</Label>
                <Input id="it-app-name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.category')}</Label>
                <Select aria-label={i18n.t('it_apps.category')} value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{i18n.t(`it_apps.category_${cat}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.description')}</Label>
                <textarea aria-label={i18n.t('it_apps.description')} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="flex w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 spring-transition"
                />
              </div>

              {/* Icon upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.icon')}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary overflow-hidden border border-border/20">
                    {form.icon ? (
                      <img src={form.icon} alt={i18n.t('it_apps.icon')} className="h-full w-full object-cover" />
                    ) : (
                      <Image className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}
                      className="h-8 rounded-full text-caption font-semibold hover:bg-muted/40 spring-transition">
                      <Camera className="h-3.5 w-3.5" />
                      {form.icon ? i18n.t('profile.avatar') : i18n.t('profile.avatar')}
                    </Button>
                    {form.icon && (
                      <Button variant="ghost" size="sm" onClick={() => setForm(p => ({ ...p, icon: '' }))}
                        className="h-8 rounded-full text-caption font-semibold hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60 spring-transition ml-1">
                        {i18n.t('delete')}
                      </Button>
                    )}
                    <p className="text-micro text-muted-foreground/60 mt-1">{i18n.t('it_apps.icon_help')}</p>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/svg+xml,image/*" onChange={handleIconUpload} className="hidden" />
              </div>

              {/* Official Site */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.official_site')}</Label>
                <Input id="it-app-site" value={form.officialSite} onChange={(e) => setForm(p => ({ ...p, officialSite: e.target.value }))}
                  placeholder="https://"
                  className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
              </div>

              {/* Download URL */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.download_url')}</Label>
                <Input id="it-app-dl" value={form.downloadUrl} onChange={(e) => setForm(p => ({ ...p, downloadUrl: e.target.value }))}
                  placeholder="https://"
                  className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" />
                <p className="text-micro text-muted-foreground/60">{i18n.t('it_apps.download_url_help')}</p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('it_apps.notes')}</Label>
                <textarea aria-label={i18n.t('it_apps.notes')} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="flex w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 spring-transition"
                />
                <p className="text-micro text-muted-foreground/60">{i18n.t('it_apps.notes_help')}</p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-bold border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}
                  className="h-10 rounded-full text-xs font-semibold hover:bg-muted/40 spring-transition">
                  {i18n.t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={saving}
                  className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? i18n.t('saving') : (editingId ? i18n.t('settings.save') : i18n.t('it_apps.add'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={i18n.t('it_apps.delete')}
        description={i18n.t('it_apps.delete_confirm').replace('{name}', deleteTarget?.name || '')}
        confirmText={i18n.t('it_apps.delete')}
        cancelText={i18n.t('cancel') || 'Cancel'}
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
