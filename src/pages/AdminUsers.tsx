import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, X, AlertTriangle, Check, Trash2, Send, Bell, User as UserIcon, Lock, Shield } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'
import { db, ALL_PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/db'
import type { Permission, Role, Department, User } from '@/lib/types'
import { roleBadge, getDepartmentConfig } from '@/lib/constants'

export default function AdminUsers() {
  const { users, isLoading, fetchUsers, createUser, updateUser, updateUserPassword, deleteUser } = useUserStore()
  const currentUser = useAuthStore(s => s.user)
  
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('developer')
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState<Department | ''>('')
  const [active, setActive] = useState(true)
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState('')

  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastError, setBroadcastError] = useState('')
  const [broadcastSuccess, setBroadcastSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function resetForm() {
    setName('')
    setUsername('')
    setEmail('')
    setRole('developer')
    setTitle('')
    setDepartment('')
    setActive(true)
    setPassword('')
    setPermissions([])
    setEditUser(null)
    setError('')
  }

  function openEdit(u: User) {
    setEditUser(u)
    setName(u.name)
    setUsername(u.username)
    setEmail(u.email)
    setRole(u.role)
    setTitle(u.title || '')
    setDepartment(u.department || '')
    setActive(u.active)
    setPassword('')
    setPermissions([...u.permissions])
    setModalOpen(true)
  }

  function openCreate() {
    resetForm()
    setPermissions([...ROLE_PERMISSIONS.developer])
    setModalOpen(true)
  }

  function handleRoleChange(newRole: Role) {
    setRole(newRole)
    if (!editUser) {
      setPermissions([...ROLE_PERMISSIONS[newRole]])
    }
  }

  function togglePermission(perm: Permission) {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  async function handleSave() {
    if (!name.trim() || !username.trim()) {
      setError(i18n.t('admin_users.error_name_username'))
      return
    }
    setError('')
    try {
      if (editUser) {
        await updateUser(editUser.id, {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          role,
          title: title.trim() || undefined,
          department: department || undefined,
          active,
          permissions,
        })
        if (password.trim()) {
          await updateUserPassword(editUser.username, password.trim())
        }
      } else {
        await createUser({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          role,
          title: title.trim() || undefined,
          department: department || undefined,
          active,
          permissions,
          approved: true,
        }, password.trim() || undefined)
      }
      setModalOpen(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('admin_users.error_save'))
    }
  }

  async function handleToggleActive(u: User) {
    try {
      await updateUser(u.id, { active: !u.active })
    } catch (e) {
      console.error('handleToggleActive failed', e)
    }
  }

  async function handleDelete(u: User) {
    if (u.id === currentUser?.id) {
      alert(i18n.lang === 'ar' ? 'لا يمكنك حذف حسابك الخاص!' : 'You cannot delete your own account!')
      return
    }
    if (window.confirm(i18n.t('admin_users.confirm_delete').replace('{name}', u.name))) {
      try {
        await deleteUser(u.id)
      } catch (e) {
        console.error('handleDelete failed', e)
      }
    }
  }

  async function handleApprove(u: User) {
    try {
      await updateUser(u.id, { approved: true, active: true })
    } catch (e) {
      console.error('handleApprove failed', e)
    }
  }

  async function handleReject(u: User) {
    if (window.confirm(i18n.t('admin_users.confirm_reject').replace('{name}', u.name))) {
      try {
        await deleteUser(u.id)
      } catch (e) {
        console.error('handleReject failed', e)
      }
    }
  }

  async function handleSendBroadcast() {
    if (!broadcastMsg.trim()) {
      setBroadcastError(i18n.t('admin_users.error_broadcast_content'))
      return
    }
    setBroadcastError('')
    setBroadcastSuccess('')
    try {
      const activeUsers = users.filter(u => u.approved !== false)
      activeUsers.forEach(u => {
        db.addNotification({
          userId: u.id,
          type: 'announcement',
          title: i18n.t('announcement.title'),
          message: broadcastMsg.trim(),
          read: false
        })
      })
      setBroadcastSuccess(i18n.t('admin_users.broadcast_success'))
      setBroadcastMsg('')
      setTimeout(() => {
        setBroadcastOpen(false)
        setBroadcastSuccess('')
      }, 1500)
    } catch (e) {
      setBroadcastError(e instanceof Error ? e.message : i18n.t('admin_users.error_broadcast_send'))
    }
  }

  const filteredUsers = useMemo(() => users.filter((u) => {
    if (activeTab === 'pending') return u.approved === false
    return u.approved !== false
  }), [users, activeTab])

  const activeCount = useMemo(() => users.filter(u => u.approved !== false).length, [users])
  const pendingCount = useMemo(() => users.filter(u => u.approved === false).length, [users])

  return (
    <div className="space-y-5 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between animate-rise stagger-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{i18n.t('users.title')}</h1>
          <p className="text-xs text-muted-foreground/80 mt-1">{i18n.t('admin_users.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) resetForm(); setModalOpen(o) }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                {i18n.t('users.create')}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? i18n.t('users.edit') : i18n.t('users.create')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dialogName">{i18n.t('users.name')}</Label>
                <Input id="dialogName" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialogUsername">{i18n.t('users.username')}</Label>
                <Input id="dialogUsername" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={50} disabled={!!editUser} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialogEmail">{i18n.t('users.email')}</Label>
                <Input id="dialogEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialogTitle">{i18n.t('users.title_field')}</Label>
                <Input id="dialogTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" maxLength={100} placeholder={i18n.t('profile.title_placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialogDepartment">{i18n.t('users.department')}</Label>
                <Select aria-label={i18n.t('users.department')} value={department} onValueChange={(v) => setDepartment(v as Department | '')}>
                  <SelectTrigger id="dialogDepartment" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition"><SelectValue placeholder={i18n.t('profile.department_placeholder')} /></SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="dialogRole">{i18n.t('users.role')}</Label>
                <Select aria-label={i18n.t('users.role')} value={role} onValueChange={(v) => handleRoleChange(v as Role)}>
                  <SelectTrigger id="dialogRole" className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{i18n.t('user.admin')}</SelectItem>
                    <SelectItem value="manager">{i18n.t('user.manager')}</SelectItem>
                    <SelectItem value="developer">{i18n.t('user.developer')}</SelectItem>
                    <SelectItem value="viewer">{i18n.t('user.viewer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <fieldset className="flex items-center gap-3 border-0 p-0 m-0">
                <legend className="sr-only">{i18n.t('users.active')}</legend>
                <input type="checkbox" id="userActive" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-muted" />
                <Label htmlFor="userActive">{i18n.t('users.active')}</Label>
              </fieldset>
              {editUser && (
                <div className="space-y-2">
                  <Label htmlFor="dialogPassword" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    {i18n.t('users.password')}
                  </Label>
                  <Input id="dialogPassword" type="password" placeholder={i18n.t('users.password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl bg-background/50 border-border/40 spring-transition" autoComplete="new-password" />
                </div>
              )}
              <div className="space-y-3 border-t border-border/10 pt-4">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  {i18n.t('users.permissions_section')}
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="mt-0.5 h-4 w-4 rounded border-muted"
                      />
                      <span className="text-xs text-foreground/80 group-hover:text-foreground spring-transition leading-tight">
                        {i18n.t(`perm.${perm}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setModalOpen(false)} className="h-10 rounded-full spring-transition px-4">{i18n.t('cancel')}</Button>
                <Button onClick={handleSave} className="h-10 rounded-full spring-transition px-4 font-semibold">{i18n.t('save')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/10 w-fit animate-rise stagger-2">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            "pill-tab spring-fast",
            activeTab === 'active' ? "pill-tab-active" : "pill-tab-inactive"
          )}
        >
          {i18n.t('users.active')} ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "pill-tab spring-fast",
            activeTab === 'pending' ? "pill-tab-active" : "pill-tab-inactive"
          )}
        >
          {i18n.t('users.pending')} ({pendingCount})
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel animate-rise stagger-3">
        <div className="glass-panel-inner p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <UserIcon className="mb-3 h-10 w-10 text-muted-foreground/20" />
              <p className="text-base font-semibold text-foreground">{i18n.t('admin_users.no_users').replace('{tab}', activeTab === 'pending' ? i18n.t('users.pending') : '')}</p>
              <p className="text-sm text-muted-foreground mt-1">{i18n.t('admin_users.no_users_desc')}</p>
              {activeTab === 'active' && (
                  <Button onClick={openCreate} className="mt-4 h-9 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    {i18n.t('admin_users.create_user')}
                  </Button>
              )}
            </div>
          ) : (
            <Table>
              <caption className="sr-only">{i18n.t('users.title')}</caption>
              <TableHeader>
                <TableRow>
                  <th scope="col" className="sr-only">{i18n.t('users.name')}</th>
                  <TableHead className="text-xs font-medium">{i18n.t('users.name')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('users.username')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('users.email')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('users.department')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('users.title_field')}</TableHead>
                  <TableHead className="text-xs font-medium">{i18n.t('users.role')}</TableHead>
                  {activeTab === 'active' && <TableHead className="text-xs font-medium">{i18n.t('users.status')}</TableHead>}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 spring-fast">
                    <TableCell className="text-sm font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.department ? (
                        <Badge variant={getDepartmentConfig(u.department).variant} className="rounded-full text-caption px-2 py-0">{i18n.t(getDepartmentConfig(u.department).label)}</Badge>
                      ) : (
                        <span className="text-caption text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.title || <span className="text-caption text-muted-foreground/40">—</span>}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadge[u.role]} className="rounded-full text-caption px-2.5 py-0">
                        {i18n.t(`user.${u.role}`)}
                      </Badge>
                    </TableCell>
                    {activeTab === 'active' && (
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', u.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', u.active ? 'bg-success neon-dot' : 'bg-destructive')} style={u.active ? { width: 6, height: 6 } : {}} />
                          {u.active ? i18n.t('users.active') : i18n.t('users.inactive')}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      {activeTab === 'active' ? (
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary spring-transition" title={i18n.t('edit')}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleActive(u)} className="h-7 w-7 rounded-full hover:bg-amber-500/10 hover:text-amber-500 spring-transition" title={u.active ? (i18n.lang === 'ar' ? 'تعطيل الحساب' : 'Deactivate') : (i18n.lang === 'ar' ? 'تفعيل الحساب' : 'Activate')}>{u.active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}</Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive spring-transition" title={i18n.t('delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(u)} className="h-7 w-7 rounded-full text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 spring-transition" title={i18n.t('users.approve')}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(u)} className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive spring-transition" title={i18n.t('users.reject')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* FAB for Broadcast */}
      <button
        onClick={() => { setBroadcastOpen(true) }}
        className="fab"
      >
        <Bell className="h-4 w-4" />
        {i18n.t('admin_users.broadcast')}
      </button>

      {/* Animated Broadcast Modal */}
      <div
        className={cn('modal-overlay', broadcastOpen && 'active')}
        onClick={(e) => { if (e.target === e.currentTarget) { setBroadcastOpen(false); setBroadcastMsg(''); setBroadcastError(''); setBroadcastSuccess('') } }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setBroadcastOpen(false); setBroadcastMsg(''); setBroadcastError(''); setBroadcastSuccess('') } }}
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
              onClick={() => { setBroadcastOpen(false); setBroadcastMsg(''); setBroadcastError(''); setBroadcastSuccess('') }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 spring-fast text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">{i18n.t('admin_users.broadcast_title')}</Label>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder={i18n.t('admin_users.broadcast_placeholder')}
                rows={4}
                className="flex w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 spring-transition"
              />
            </div>
            {broadcastError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-bold border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {broadcastError}
              </div>
            )}
            {broadcastSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500 font-bold border border-emerald-500/20">
                <Check className="h-4 w-4 shrink-0" />
                {broadcastSuccess}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setBroadcastOpen(false); setBroadcastMsg(''); setBroadcastError(''); setBroadcastSuccess('') }} className="h-10 rounded-full text-xs font-semibold hover:bg-muted/40 spring-transition">
                {i18n.t('cancel')}
              </Button>
              <Button onClick={handleSendBroadcast} className="h-10 rounded-full bg-primary hover:bg-primary/90 text-xs font-semibold spring-transition shadow-lg shadow-primary/20">
                <Send className="h-3.5 w-3.5 ml-1" />
                {i18n.t('admin_users.broadcast_send')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
