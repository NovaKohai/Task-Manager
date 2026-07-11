import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, User, Mail, Lock, Check, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { getInitials, roleBadge, getDepartmentConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { Department } from '@/lib/types'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState(user?.title ?? '')
  const [department, setDepartment] = useState(user?.department ?? '' as Department | '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(i18n.t('profile.avatar_too_large'))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setAvatar(reader.result)
      }
      reader.onerror = () => setError(i18n.t('profile.avatar_error'))
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
  }

  const handleSave = async () => {
    if (saving) return
    setError('')
    setSaved(false)
    if (!name.trim()) {
      setError(i18n.t('profile.name_required'))
      return
    }
    if (!username.trim()) {
      setError(i18n.t('register.all_fields_required'))
      return
    }

    setSaving(true)
    try {
      const updated = db.updateUser(user.id, {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        title: title.trim() || undefined,
        department: department || undefined,
        avatar: avatar || undefined
      })

      if (updated) {
        if (password.trim()) {
          await db.updatePassword(username.trim(), password.trim())
          setPassword('')
        }
        useAuthStore.setState({ user: updated })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(i18n.t('profile.update_failed'))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('profile.update_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto page-bg">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40 animate-rise stagger-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-8 w-8 hover:bg-accent/40 spring-transition">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground">{i18n.t('profile.title')}</h1>
            <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('profile.subtitle')}</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-500 font-bold flex items-center gap-2 border animate-rise">
          <Check className="h-4 w-4 shrink-0" />
          {i18n.t('profile.saved')}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-bold flex items-center gap-2 border animate-rise">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-rise stagger-2">
        {/* Left Side: Avatar block */}
        <div className="double-bezel-outer md:col-span-4 hover:-translate-y-1 spring-transition">
          <div className="double-bezel-inner flex flex-col items-center justify-center py-8">
            <button type="button" className="relative group/avatar cursor-pointer mb-5 text-left" onClick={handleAvatarClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvatarClick() } }}>
              <Avatar className="h-24 w-24 ring-4 ring-primary/20 group-hover/avatar:ring-primary/40 spring-transition">
                {avatar && <AvatarImage src={avatar} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                  {getInitials(name || user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 spring-transition">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </button>

            <h2 className="text-sm font-bold text-foreground text-center">{name}</h2>
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
              <Badge variant={roleBadge[user.role]} className="rounded-full text-micro px-2 py-0">{i18n.t(`user.${user.role}`)}</Badge>
              {department && (
                <Badge variant={getDepartmentConfig(department).variant} className="rounded-full text-micro px-2 py-0">{i18n.t(getDepartmentConfig(department).label)}</Badge>
              )}
            </div>
            {title && <p className="text-caption text-muted-foreground text-center mt-2">{title}</p>}

            <div className="flex gap-2 mt-6">
                <Button variant="ghost" size="sm" onClick={handleAvatarClick} className="h-7 text-caption font-semibold rounded-full px-3.5 hover:bg-muted/40 spring-transition">
                {i18n.t('profile.avatar')}
              </Button>
              {avatar && (
                <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="h-7 text-caption font-semibold rounded-full px-3.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60 spring-transition">
                  {i18n.t('delete')}
                </Button>
              )}
            </div>
            <p className="text-micro text-muted-foreground/60 text-center px-4 mt-4 leading-normal">{i18n.t('profile.avatar_help')}</p>
          </div>
        </div>

        {/* Right Side: Fields block */}
        <div className="double-bezel-outer md:col-span-8 hover:-translate-y-1 spring-transition">
          <div className="double-bezel-inner space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profName" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.name')}</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input id="profName" value={name} onChange={(e) => setName(e.target.value)} className="pr-9 h-10 rounded-xl bg-background/50 border-muted/40 font-semibold spring-transition" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profEmail" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.email')}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input id="profEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-9 h-10 rounded-xl bg-background/50 border-muted/40 font-semibold spring-transition" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="profUsername" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.username')}</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input id="profUsername" value={username} onChange={(e) => setUsername(e.target.value)} className="pr-9 h-10 rounded-xl bg-background/50 border-muted/40 font-semibold spring-transition" maxLength={50} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profPassword" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.password')}</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input id="profPassword" type="password" placeholder={i18n.t('profile.password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9 h-10 rounded-xl bg-background/50 border-muted/40 font-semibold spring-transition" autoComplete="new-password" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profTitle" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.title_field')}</Label>
                <Input id="profTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl bg-background/50 border-muted/40 font-semibold spring-transition" maxLength={100} placeholder={i18n.t('profile.title_placeholder')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profDepartment" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.department')}</Label>
                <Select aria-label={i18n.t('profile.department')} value={department} onValueChange={(v) => setDepartment(v as Department | '')}>
                  <SelectTrigger id="profDepartment" className="h-10 rounded-xl bg-background/50 border-muted/40 spring-transition"><SelectValue placeholder={i18n.t('profile.department_placeholder')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    <SelectItem value="engineering">{i18n.t('department.engineering')}</SelectItem>
                    <SelectItem value="qa">{i18n.t('department.qa')}</SelectItem>
                    <SelectItem value="it">{i18n.t('department.it')}</SelectItem>
                    <SelectItem value="hr">{i18n.t('department.hr')}</SelectItem>
                    <SelectItem value="finance">{i18n.t('department.finance')}</SelectItem>
                    <SelectItem value="accounting">{i18n.t('department.accounting')}</SelectItem>
                    <SelectItem value="marketing">{i18n.t('department.marketing')}</SelectItem>
                    <SelectItem value="sales">{i18n.t('department.sales')}</SelectItem>
                    <SelectItem value="operations">{i18n.t('department.operations')}</SelectItem>
                    <SelectItem value="design">{i18n.t('department.design')}</SelectItem>
                    <SelectItem value="legal">{i18n.t('department.legal')}</SelectItem>
                    <SelectItem value="customer_support">{i18n.t('department.customer_support')}</SelectItem>
                    <SelectItem value="product">{i18n.t('department.product')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <Button onClick={handleSave} disabled={saving} className="h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold spring-transition active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center px-6">
                {saving ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{i18n.t('saving')}</span>
                ) : i18n.t('profile.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
