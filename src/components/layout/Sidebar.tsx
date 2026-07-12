import { memo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Users, BarChart3,
  Settings, ScrollText, Bell, LogOut, LifeBuoy, MessageSquare,
} from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'
import { getInitials, roleBadge, getDepartmentConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

interface SidebarProps { user: User; onLogout: () => void; unreadCount?: number }

type Link = { to: string; label: string; icon: typeof LayoutDashboard; badge?: boolean }

const adminLinks: Link[] = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'nav.tasks', icon: CheckSquare },
  { to: '/admin/users', label: 'nav.users', icon: Users },
  { to: '/reports', label: 'nav.reports', icon: BarChart3 },
  { to: '/support', label: 'nav.support', icon: LifeBuoy },
  { to: '/chat', label: 'nav.chat', icon: MessageSquare },
  { to: '/settings', label: 'nav.settings', icon: Settings },
  { to: '/admin/audit-log', label: 'nav.audit_log', icon: ScrollText },
]

const userLinks: Link[] = [
  { to: '/my-dashboard', label: 'nav.my_dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'nav.my_tasks', icon: CheckSquare },
  { to: '/notifications', label: 'nav.notifications', icon: Bell, badge: true },
  { to: '/chat', label: 'nav.chat', icon: MessageSquare },
  { to: '/support', label: 'nav.support', icon: LifeBuoy },
]

export default memo(function Sidebar({ user, onLogout, unreadCount = 0 }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const links = isAdmin ? adminLinks : userLinks

  return (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-surface/40 backdrop-blur-xl rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0 shadow-diffusion">
          <div className="flex h-16 items-center gap-2 border-b border-border/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
          <svg viewBox="0 0 64 64" fill="none" className="h-5.5 w-5.5 text-primary-foreground">
            <path d="M20 22H44" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M32 22V36C32 40 29 43 25 43" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M30 38L35 43L46 26" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-outfit text-base font-black tracking-tight text-foreground">{i18n.t('app.name')}</span>
      </div>

      <nav aria-label={i18n.t('nav.main')} className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {isAdmin && (
          <p className="px-3 pb-1 pt-3 text-caption font-semibold uppercase tracking-widest text-muted-foreground/40">
            {i18n.t('nav.admin')}
          </p>
        )}
        {links.map((link: Link) => {
          const isActive = location.pathname === link.to
          const Icon = link.icon
          const showBadge = link.badge && unreadCount > 0
          return (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold tracking-wide spring-fast pressable rtl:border-r-4 ltr:border-l-4',
                isActive
                  ? 'text-primary bg-primary/5 rtl:border-r-primary ltr:border-l-primary'
                  : 'text-muted-foreground/80 border-transparent hover:bg-primary/10 hover:text-primary'
              )}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/80')} />
                <span>{i18n.t(link.label)}</span>
              </span>
              {showBadge && (
                <span className="shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-micro font-bold bg-destructive text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-muted/30 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3 border border-border/10 spring-transition">
          <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/user text-left pressable">
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20 group-hover/user:ring-primary/40 spring-transition">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight group-hover/user:text-primary spring-transition">{user.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <Badge variant={roleBadge[user.role]} className="rounded-full text-micro px-1.5 py-0 leading-none">{i18n.t(`user.${user.role}`)}</Badge>
                {user.department && (
                  <Badge variant={getDepartmentConfig(user.department).variant} className="rounded-full text-micro px-1.5 py-0 leading-none">{i18n.t(getDepartmentConfig(user.department).label)}</Badge>
                )}
              </div>
            </div>
          </button>
          <Button variant="ghost" size="icon" onClick={onLogout} title={i18n.t('logout')} className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 rounded-full spring-transition">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
})
