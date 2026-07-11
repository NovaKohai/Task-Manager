import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  
  // Sign In States
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // Register States
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)
  
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) { setError(i18n.t('login.error')); return }
    try {
      const ok = await login(username.trim(), password)
      if (ok) navigate('/dashboard')
      else setError(i18n.t('login.error'))
    } catch (e: any) {
      setError(e.message || i18n.t('login.error'))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setError('All fields are required')
      return
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    const hasUppercase = /[A-Z]/.test(regPassword)
    const hasNumber = /[0-9]/.test(regPassword)
    if (!hasUppercase || !hasNumber) {
      setError(i18n.t('register.pwd_helper'))
      return
    }

    try {
      await db.createUser({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim(),
        role: 'developer', // default role
        active: false,     // inactive until approved
        approved: false,   // pending approval
      }, regPassword)

      setRegSuccess(true)
      setError('')
      setRegName('')
      setRegEmail('')
      setRegUsername('')
      setRegPassword('')
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Background glow orb */}
      <div className="mesh-glow -top-20 -left-20"></div>
      
      <div className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 p-2">
            <svg viewBox="0 0 64 64" fill="none" className="h-8 w-8 text-primary animate-pulse">
              <path d="M20 22H44" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M32 22V36C32 40 29 43 25 43" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M30 38L35 43L46 26" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">{i18n.t('app.name')}</h1>
          <p className="mt-1 text-xs text-muted-foreground/80">{i18n.t('login.subtitle')}</p>
        </div>

        {/* Tab switch container */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-2xl border border-border/10">
          <button
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={cn(
              "flex-1 py-1.5 text-center rounded-xl text-xs font-bold transition-[background,color,box-shadow] duration-200",
              activeTab === 'signin' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            {i18n.t('tab.signin')}
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={cn(
              "flex-1 py-1.5 text-center rounded-xl text-xs font-bold transition-[background,color,box-shadow] duration-200",
              activeTab === 'register' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            {i18n.t('tab.register')}
          </button>
        </div>

        <div className="double-bezel-outer spring-transition">
          <div className="double-bezel-inner">
            {regSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 p-2">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xs font-semibold text-foreground leading-relaxed px-2">{i18n.t('register.success')}</h2>
                <Button onClick={() => { setRegSuccess(false); setActiveTab('signin'); }} className="w-full h-9 rounded-full mt-4 spring-transition">
                  {i18n.t('close')}
                </Button>
              </div>
            ) : activeTab === 'signin' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-semibold text-muted-foreground">{i18n.t('login.username')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="username" type="text" placeholder={i18n.t('login.username')} value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" autoComplete="username" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">{i18n.t('login.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" autoComplete="current-password" />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 leading-normal">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold transition-[opacity] duration-200 active:scale-[0.98] shadow-md shadow-primary/10 flex items-center justify-between px-5 py-2.5 mt-2 group" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{i18n.t('login.btn')}</span>
                  ) : (
                    <>
                      <span>{i18n.t('login.btn')}</span>
                      <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 spring-transition">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="regName" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.name')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="regName" type="text" placeholder={i18n.t('register.fullname_placeholder')} value={regName} onChange={(e) => setRegName(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="regEmail" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.email')}</label>
                  <Input id="regEmail" type="email" placeholder={i18n.t('register.email_placeholder')} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="h-10 rounded-xl bg-muted/20 border-muted/40" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regUsername" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.username')}</label>
                  <Input id="regUsername" type="text" placeholder="username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="h-10 rounded-xl bg-muted/20 border-muted/40" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regPassword" className="text-xs font-semibold text-muted-foreground">{i18n.t('login.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="regPassword" type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" />
                  </div>
                  <p className="text-micro text-muted-foreground/60 mt-1 leading-normal">{i18n.t('register.pwd_helper')}</p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 leading-normal">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold transition-[opacity] duration-200 active:scale-[0.98] shadow-md shadow-primary/10 flex items-center justify-between px-5 py-2.5 mt-2 group">
                  <span>{i18n.t('register.btn')}</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 spring-transition">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                </Button>
              </form>
            )}
            {activeTab === 'signin' && (
              <p className="mt-4 text-center text-caption text-muted-foreground/80">{i18n.t('login.demo_hint')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
