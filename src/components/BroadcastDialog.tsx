import { useState } from 'react'
import { X, Bell, AlertTriangle, Check, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import { db } from '@/lib/db'
import { useAuthStore } from '@/stores/authStore'
import type { User, Role } from '@/lib/types'

interface BroadcastDialogProps {
  open: boolean
  onClose: () => void
  users: User[]
}

export default function BroadcastDialog({ open, onClose, users }: BroadcastDialogProps) {
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')

  function reset() {
    setMsg('')
    setError('')
    setSuccess('')
    setFilterRole('all')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSend() {
    if (!msg.trim()) {
      setError(i18n.t('admin_users.error_broadcast_content'))
      return
    }
    setError('')
    setSuccess('')
    try {
      let activeUsers = users.filter(u => u.approved !== false)
      if (filterRole !== 'all') {
        activeUsers = activeUsers.filter(u => u.role === filterRole)
      }
      activeUsers.forEach(u => {
        db.addNotification({
          userId: u.id,
          type: 'announcement',
          title: i18n.t('announcement.title'),
          message: msg.trim(),
          read: false
        })
      })
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        db.addAuditEntry('broadcast_sent', currentUser.id, currentUser.username,
          i18n.t('db.broadcast_sent').replace('{count}', String(activeUsers.length)).replace('{role}', filterRole))
      }
      setSuccess(i18n.t('admin_users.broadcast_success'))
      setMsg('')
      setTimeout(() => { handleClose() }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('admin_users.error_broadcast_send'))
    }
  }

  if (!open) return null

  return (
    <div
      className={cn('modal-overlay active')}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{i18n.t('admin_users.broadcast_title')}</h2>
              <p className="text-caption text-muted-foreground">{i18n.t('admin_users.broadcast_desc')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 spring-fast text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {i18n.t('admin_users.broadcast_title')}
            </Label>
            <Select aria-label={i18n.t('admin_users.broadcast_title')} value={filterRole} onValueChange={(v) => setFilterRole(v as Role | 'all')}>
              <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{i18n.t('admin_users.broadcast_role_all')}</SelectItem>
                <SelectItem value="admin">{i18n.t('user.admin')}</SelectItem>
                <SelectItem value="manager">{i18n.t('user.manager')}</SelectItem>
                <SelectItem value="developer">{i18n.t('user.developer')}</SelectItem>
                <SelectItem value="viewer">{i18n.t('user.viewer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('admin_users.broadcast_message')}</Label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={i18n.t('admin_users.broadcast_placeholder')}
              rows={4}
              className="flex w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 spring-transition"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-bold border border-destructive/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500 font-bold border border-emerald-500/20">
              <Check className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleClose} className="h-10 rounded-full text-xs font-semibold hover:bg-muted/40 spring-transition">
              {i18n.t('cancel')}
            </Button>
            <Button onClick={handleSend} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
              <Send className="h-3.5 w-3.5 ml-1" />
              {i18n.t('admin_users.broadcast_send')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
