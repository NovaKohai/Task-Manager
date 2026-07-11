import { Link } from 'react-router-dom'
import { Bell, Moon, Search, Sun } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/stores/themeStore'
import type { User } from '@/lib/types'

interface HeaderProps { user: User; unreadCount: number }

export default function Header({ user, unreadCount }: HeaderProps) {
  const isDark = useThemeStore(s => s.isDark)
  const toggleTheme = useThemeStore(s => s.toggle)

  const hour = new Date().getHours()
  let greetingKey: string
  if (hour < 12) greetingKey = 'greeting.morning'
  else if (hour < 18) greetingKey = 'greeting.afternoon'
  else greetingKey = 'greeting.evening'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/10 bg-background/50 backdrop-blur-md px-4 md:px-6 lg:px-8 spring-transition">
      <div className="flex-1">
        <h1 className="text-xs font-semibold">
          {i18n.t(greetingKey)},{' '}
          <span className="text-primary font-bold">{user.name.split(' ')[0]}</span>
        </h1>
      </div>

      <div className="relative hidden w-56 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          placeholder={i18n.t('search')}
          className="h-8 w-full rounded-full border border-input/40 bg-muted/30 pl-9 pr-4 text-xs outline-none transition-[border-color,background] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-muted-foreground/40 focus:border-primary/30 focus:bg-background/80"
        />
      </div>

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
        onClick={() => {
          i18n.toggle()
          window.location.reload()
        }}
        className="flex h-8 items-center rounded-full border border-input/50 px-3 text-caption font-semibold text-muted-foreground/80 hover:text-foreground hover:border-primary transition-[color,border-color] duration-200 pressable"
      >
        {i18n.t(`lang.${i18n.lang}`)}
      </button>
    </header>
  )
}
