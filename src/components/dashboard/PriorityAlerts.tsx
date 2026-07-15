import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, UserPlus, LifeBuoy, Bell, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/lib/db'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function PriorityAlerts() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tasks } = useTaskStore()

  // Find user tasks that are open (not done/cancelled)
  const openTasks = useMemo(() => {
    return tasks.filter(t => t.assigneeId === user?.id && t.status !== 'done' && t.status !== 'cancelled')
  }, [tasks, user?.id])

  // Overdue open tasks
  const overdueTasks = useMemo(() => {
    return openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
  }, [openTasks])

  // Critical open tasks
  const criticalTasks = useMemo(() => {
    return openTasks.filter(t => t.priority === 'critical')
  }, [openTasks])

  // Admins pending approvals count
  const isAdmin = user?.role === 'admin'
  const pendingApprovalsCount = useMemo(() => {
    if (!isAdmin) return 0
    return db.users.filter(u => u.approved === false).length
  }, [isAdmin])

  // IT support queue unassigned tickets
  const canManageSupport = user?.permissions.includes('support.manage')
  const unassignedTicketsCount = useMemo(() => {
    if (!canManageSupport) return 0
    return db.supportTickets.filter(t => t.status === 'pending' && !t.assigneeId).length
  }, [canManageSupport])

  // Inbox unread notifications
  const unreadNotifsCount = useMemo(() => {
    if (!user) return 0
    return db.notifications.filter(n => n.userId === user.id && !n.read).length
  }, [user])

  // Build the prioritized actions list
  const alertsList = useMemo(() => {
    const list = []

    if (overdueTasks.length > 0) {
      list.push({
        id: 'overdue',
        type: 'danger',
        icon: Clock,
        text: i18n.t('dashboard.alert_overdue').replace('{count}', String(overdueTasks.length)),
        actionLabel: i18n.t('dashboard.action_review'),
        to: '/tasks'
      })
    }

    if (criticalTasks.length > 0) {
      list.push({
        id: 'critical',
        type: 'warning',
        icon: AlertTriangle,
        text: i18n.t('dashboard.alert_critical').replace('{count}', String(criticalTasks.length)),
        actionLabel: i18n.t('dashboard.action_review'),
        to: '/tasks'
      })
    }

    if (pendingApprovalsCount > 0) {
      list.push({
        id: 'pending_users',
        type: 'info',
        icon: UserPlus,
        text: i18n.t('dashboard.alert_pending_users').replace('{count}', String(pendingApprovalsCount)),
        actionLabel: i18n.t('dashboard.action_approve'),
        to: '/admin/users'
      })
    }

    if (unassignedTicketsCount > 0) {
      list.push({
        id: 'support_tickets',
        type: 'help',
        icon: LifeBuoy,
        text: i18n.t('dashboard.alert_support').replace('{count}', String(unassignedTicketsCount)),
        actionLabel: i18n.t('dashboard.action_solve'),
        to: '/support'
      })
    }

    if (unreadNotifsCount > 0) {
      list.push({
        id: 'unread_notifs',
        type: 'neutral',
        icon: Bell,
        text: i18n.t('dashboard.alert_notifications').replace('{count}', String(unreadNotifsCount)),
        actionLabel: i18n.t('dashboard.action_view'),
        to: '/notifications'
      })
    }

    return list
  }, [overdueTasks, criticalTasks, pendingApprovalsCount, unassignedTicketsCount, unreadNotifsCount])

  if (alertsList.length === 0) return null

  return (
    <div className="double-bezel-outer animate-rise stagger-1.5">
      <div className="double-bezel-inner">
        <div className="flex items-center gap-2 mb-4 border-b border-border/10 pb-3">
          <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">{i18n.t('dashboard.priority_alerts_title')}</h2>
        </div>
        <div className="space-y-3">
          {alertsList.map((alert) => {
            const Icon = alert.icon
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 gap-4 flex-wrap sm:flex-nowrap",
                  alert.type === 'danger' && "bg-destructive/10 border-destructive/20 text-destructive",
                  alert.type === 'warning' && "bg-orange-500/10 border-orange-500/20 text-orange-500",
                  alert.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                  alert.type === 'help' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                  alert.type === 'neutral' && "bg-primary/10 border-primary/20 text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{alert.text}</p>
                </div>
                <button
                  onClick={() => navigate(alert.to)}
                  className={cn(
                    "h-8 px-4 rounded-full text-caption font-bold shadow-sm spring-transition pressable flex items-center gap-1.5 shrink-0",
                    alert.type === 'danger' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    alert.type === 'warning' && "bg-orange-500 text-white hover:bg-orange-500/90",
                    alert.type === 'info' && "bg-blue-500 text-white hover:bg-blue-500/90",
                    alert.type === 'help' && "bg-amber-500 text-white hover:bg-amber-500/90",
                    alert.type === 'neutral' && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
