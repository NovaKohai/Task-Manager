import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, User, Mail, Shield, Check, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { getInitials } from '@/lib/constants'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
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
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
  }

  const handleSave = async () => {
    setError('')
    setSaved(false)
    if (!name.trim()) {
      setError(i18n.t('profile.name_required'))
      return
    }

    try {
      // Save changes to database
      const updated = db.updateUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar || undefined
      })

      if (updated) {
        // Sync with React Authentication state
        useAuthStore.setState({ user: updated })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(i18n.t('profile.update_failed'))
      }
    } catch (e: any) {
      setError(e.message || i18n.t('profile.update_failed'))
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
            <p className="text-caption text-muted-foreground text-center mt-1 uppercase tracking-wider font-semibold">{i18n.t(`user.${user.role}`)}</p>

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
                <Input id="profUsername" value={user.username} disabled className="h-10 rounded-xl bg-muted/10 border-muted/20 text-muted-foreground opacity-60 font-semibold cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profRole" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.role')}</Label>
                <div className="relative">
                  <Shield className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input id="profRole" value={i18n.t(`user.${user.role}`)} disabled className="pr-9 h-10 rounded-xl bg-muted/10 border-muted/20 text-muted-foreground opacity-60 font-semibold cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <Button onClick={handleSave} className="h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold spring-transition active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center px-6">
                {i18n.t('profile.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
