import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Bell, Moon, Search, Sun, Target } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/stores/themeStore'
import { useLocaleStore } from '@/stores/localeStore'
import type { User } from '@/lib/types'
import { roleBadge } from '@/lib/constants'

interface HeaderProps { user: User; unreadCount: number }

export default function Header({ user, unreadCount }: HeaderProps) {
  const isDark = useThemeStore(s => s.isDark)
  const toggleTheme = useThemeStore(s => s.toggle)
  // Subscribe to locale changes so this component re-renders on toggle without
  // a window.location.reload().
  const lang = useLocaleStore(s => s.lang)
  const toggleLocale = useLocaleStore(s => s.toggle)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const hour = new Date().getHours()
  let greetingKey: string
  if (hour < 12) greetingKey = 'greeting.morning'
  else if (hour < 18) greetingKey = 'greeting.afternoon'
  else greetingKey = 'greeting.evening'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/10 bg-background/50 backdrop-blur-md px-4 md:px-6 lg:px-8 spring-transition">
      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-xs font-semibold flex items-center gap-2">
          <span>{i18n.t(greetingKey)},{' '}<span className="text-primary font-bold">{user.name.split(' ')[0]}</span></span>
          <Badge variant={roleBadge[user.role]} className="rounded-full text-micro px-1.5 py-0 leading-none shrink-0">{i18n.t(`user.${user.role}`)}</Badge>
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 select-none" title="All changes saved to local database storage">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{i18n.t('task.sync_status')}</span>
        </div>
      </div>

      <form
        className="relative hidden w-56 lg:block"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const q = search.trim()
          if (q) navigate(`/tasks?search=${encodeURIComponent(q)}`)
          else navigate('/tasks')
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          placeholder={i18n.t('search')}
          aria-label={i18n.t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full rounded-full border border-input/40 bg-muted/30 pl-9 pr-4 text-xs outline-none transition-[border-color,background] duration-150 ease-out placeholder:text-muted-foreground/40 focus:border-primary/30 focus:bg-background/80"
        />
      </form>

      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary spring-transition">
        <Link to="/focus">
          <Target className="h-3.5 w-3.5" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full hover:bg-accent/40 spring-transition" asChild>
        <Link to="/notifications">
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <Badge variant="default" className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-micro leading-none bg-destructive text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Link>
      </Button>

      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-full hover:bg-accent/40 spring-transition">
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </Button>

      <button
        onClick={() => toggleLocale()}
        aria-label={i18n.t('lang.toggle')}
        className="flex h-8 items-center rounded-full border border-input/50 px-3 text-caption font-semibold text-muted-foreground/80 hover:text-foreground hover:border-primary transition-[color,border-color] duration-200 pressable"
      >
        {i18n.t(`lang.${lang}`)}
      </button>
    </header>
  )
}
