import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertTriangle, ArrowRight, UserPlus, Calendar, Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { cn, formatPhone, formatDate } from '@/lib/utils'
import { NovaLogo } from '@/components/ui/NovaLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  
  // Sign In States
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin#1x9Kp!7qRs')
  
  // Register States
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regBirthDate, setRegBirthDate] = useState('')
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
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('login.error'))
    }
  }

  const handleSSOLogin = async () => {
    setError(i18n.t('login.sso_unavailable'))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!regName.trim() || !regUsername.trim() || !regPassword || !regPhone.trim() || !regBirthDate.trim()) {
      setError(i18n.t('register.all_fields_required'))
      return
    }

    // Phone validation
    const phoneDigits = regPhone.replace(/\D/g, '')
    if (phoneDigits.length !== 12) {
      setError(i18n.t('register.error_phone_invalid'))
      return
    }

    // Date validation
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!dateRegex.test(regBirthDate)) {
      setError(i18n.t('register.error_date_invalid'))
      return
    }
    const parts = regBirthDate.split('/')
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    const d = new Date(year, month, day)
    const isValidDate = d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    const currentYear = new Date().getFullYear()
    if (!isValidDate || year < 1900 || year > currentYear) {
      setError(i18n.t('register.error_date_invalid'))
      return
    }

    if (regPassword.length < 8) {
      setError(i18n.t('register.pwd_min_length'))
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
        email: regEmail.trim() || undefined,
        phone: regPhone,
        birthDate: regBirthDate,
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
      setRegPhone('')
      setRegBirthDate('')
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('register.registration_failed'))
    }
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground">
        {i18n.t('skip_to_content')}
      </a>
      <main id="main" role="main" className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Background glow orb */}
      <div className="mesh-glow -top-20 -left-20"></div>
      
      <div className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <NovaLogo showText className="h-16 w-16 text-foreground" />
          </div>
          <p className="text-xs text-muted-foreground/90">{i18n.t('login.subtitle')}</p>
        </div>

        {/* Tab switch container */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-2xl border border-border/10" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'signin'}
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={cn(
              "flex-1 py-1.5 text-center rounded-xl text-xs font-bold transition-[background,color,box-shadow] duration-200",
              activeTab === 'signin' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/90 hover:text-foreground"
            )}
          >
            {i18n.t('tab.signin')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'register'}
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={cn(
              "flex-1 py-1.5 text-center rounded-xl text-xs font-bold transition-[background,color,box-shadow] duration-200",
              activeTab === 'register' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/90 hover:text-foreground"
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
                <Button type="submit" className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold shadow-md shadow-primary/10 flex items-center justify-between px-5 py-2.5 mt-2 group" disabled={isLoading}>
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
                
                <div className="relative flex items-center justify-center my-3.5 select-none">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/10"></div></div>
                  <span className="relative bg-card px-2.5 text-[9px] text-muted-foreground/60 uppercase font-black tracking-wider">{i18n.t('ui.or')}</span>
                </div>

                <Button 
                  type="button" 
                  onClick={handleSSOLogin} 
                  variant="secondary" 
                  className="w-full h-10 rounded-full border border-border/20 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted/30 shadow-sm"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23" fill="currentColor">
                    <path d="M0 0h11v11H0z" fill="#f25022"/>
                    <path d="M12 0h11v11H12z" fill="#7fba00"/>
                    <path d="M0 12h11v11H0z" fill="#00a4ef"/>
                    <path d="M12 12h11v11H12z" fill="#ffb900"/>
                  </svg>
                  {i18n.t('task.sso_login')}
                </Button>
                <p className="text-[10px] text-muted-foreground/60 text-center select-none">
                  {i18n.t('login.sso_availability')}
                </p>
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
                  <label htmlFor="regEmail" className="text-xs font-semibold text-muted-foreground">{i18n.t('register.email_label')}</label>
                  <Input id="regEmail" type="email" placeholder={i18n.t('register.email_placeholder')} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="h-10 rounded-xl bg-muted/20 border-muted/40" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regUsername" className="text-xs font-semibold text-muted-foreground">{i18n.t('profile.username')}</label>
                  <Input id="regUsername" type="text" placeholder={i18n.t('register.username_placeholder')} value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="h-10 rounded-xl bg-muted/20 border-muted/40" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regBirthDate" className="text-xs font-semibold text-muted-foreground">{i18n.t('register.date_label')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="regBirthDate" type="text" placeholder={i18n.t('register.date_placeholder')} value={regBirthDate} onChange={(e) => setRegBirthDate(formatDate(e.target.value))} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="regPhone" className="text-xs font-semibold text-muted-foreground">{i18n.t('register.phone_label')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="regPhone" type="text" placeholder={i18n.t('register.phone_placeholder')} value={regPhone} onChange={(e) => setRegPhone(formatPhone(e.target.value))} className="pl-9 h-10 rounded-xl bg-muted/20 border-muted/40" />
                  </div>
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
                <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 text-primary-foreground font-bold shadow-md shadow-primary/10 flex items-center justify-between px-5 py-2.5 mt-2 group">
                  {isLoading ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{i18n.t('register.btn')}</span>
                  ) : <span>{i18n.t('register.btn')}</span>}
                  <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 spring-transition">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                </Button>
              </form>
            )}

          </div>
        </div>
        </div>
      </main>
    </>
  )
}
