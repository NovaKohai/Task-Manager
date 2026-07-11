import type { User, Task, Comment, Notification, ReportMetrics, AppSettings, AuditEntry, AuditAction } from './types'

const STORE_KEY = 'ttm_data'

interface StoreSchema {
  users: User[]
  tasks: Task[]
  comments: Comment[]
  notifications: Notification[]
  settings: AppSettings
  sessions: { userId: string; token: string }[]
  passwords: Record<string, string>
  auditEntries: AuditEntry[]
}

function generateId(): string {
  return crypto.randomUUID()
}

function generateTaskCode(index: number): string {
  return `TASK-${String(index).padStart(4, '0')}`
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function getDefaultSettings(): AppSettings {
  return {
    serverName: 'TeamTask Server',
    defaultTimezone: 'America/Los_Angeles',
    appUrl: 'https://ttm.internal.company.com:443',
    pwMinLength: 8, pwMaxLength: 128,
    requireUppercase: true, requireDigit: true,
    pwHistory: 10, pwMaxAge: 90, pwHashAlgo: 'Argon2id',
    lockMaxAttempts: 5, lockDuration: 15,
    accessTokenExpiry: 15, refreshTokenExpiry: 7,
    inactivityTimeout: 15, maxConcurrentSessions: 5,
    retentionDays: 365, softDeleteDays: 90, auditRetentionDays: 365,
    enableBackup: true, backupCount: 30, backupPath: '\\\\fileserver\\backups\\TeamTask',
    authRateLimit: 10, apiRateLimit: 1000,
    enableEmailNotif: true, enablePushNotif: true, enableSlackNotif: false, enableDigest: false,
    quietHoursStart: '22:00', quietHoursEnd: '07:00',
  }
}

const DEFAULT_HASHES: Record<string, string> = {
  admin: '240BE518FABD2724DDB6F04EEB1DA5967448D7E831C08C8FA822809F74C720A9',
  jane: '27545B395A8E5915B48557D0E26EF3E05E368D0F65AE786A806DF38F9F4E3BC5',
  alex: 'D9508122CD143D69DF229BF3624B7BCB2B8AC81ED210A0C926455EF119C12ABD',
  raj: '1D622460EBCE57C35328B3DBF11BF20A82D45E314A09C83EF0BC5C37A1169880',
  maya: '3688058A6965C4C8E143D7002AFB557FE910657AD819714ABB0356C7551C84B7',
}

function getDefaultStore(): StoreSchema {
  const now = new Date().toISOString()
  const admin: User = {
    id: 'user_1', username: 'admin', name: 'Admin User', email: 'admin@teamtask.local',
    role: 'admin', active: true, approved: true, createdAt: now,
  }
  const jane: User = {
    id: 'user_2', username: 'jane', name: 'Jane Doe', email: 'jane@teamtask.local',
    role: 'manager', active: true, approved: true, createdAt: now,
  }
  const alex: User = {
    id: 'user_3', username: 'alex', name: 'Alex Liu', email: 'alex@teamtask.local',
    role: 'developer', active: true, approved: true, createdAt: now,
  }
  const raj: User = {
    id: 'user_4', username: 'raj', name: 'Raj Johnson', email: 'raj@teamtask.local',
    role: 'developer', active: true, approved: true, createdAt: now,
  }
  const maya: User = {
    id: 'user_5', username: 'maya', name: 'Maya Kapoor', email: 'maya@teamtask.local',
    role: 'developer', active: true, approved: true, createdAt: now,
  }

  const tasks: Task[] = [
    { id: 'task_1', code: 'TASK-0001', title: 'Implement dark mode toggle across dashboard', description: 'Add a dark mode toggle to the main dashboard interface. The toggle should persist the user\'s preference and apply system-wide CSS variable overrides.', status: 'in_progress', priority: 'high', assigneeId: 'user_3', creatorId: 'user_2', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), estHours: 8, project: 'Frontend', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'task_2', code: 'TASK-0002', title: 'Review API rate limiting PR', description: 'Review the pull request for API rate limiting middleware.', status: 'todo', priority: 'medium', assigneeId: 'user_3', creatorId: 'user_2', dueDate: new Date(Date.now() + 86400000).toISOString(), estHours: 3, project: 'Backend', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'task_3', code: 'TASK-0003', title: 'Write unit tests for auth module', description: 'Write comprehensive unit tests for the authentication module including login, logout, and token refresh flows.', status: 'todo', priority: 'medium', assigneeId: 'user_3', creatorId: 'user_2', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), estHours: 5, project: 'Backend', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: 'task_4', code: 'TASK-0004', title: 'Update API documentation', description: 'Update the OpenAPI documentation with the new rate limiting and notification endpoints.', status: 'todo', priority: 'low', assigneeId: 'user_3', creatorId: 'user_2', dueDate: new Date(Date.now() - 86400000).toISOString(), estHours: 2, project: 'Backend', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 6).toISOString() },
    { id: 'task_5', code: 'TASK-0005', title: 'Set up staging environment', description: 'Configure the staging environment with monitoring and logging.', status: 'done', priority: 'high', assigneeId: 'user_4', creatorId: 'user_2', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), estHours: 6, project: 'DevOps', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'task_6', code: 'TASK-0006', title: 'Design new dashboard layout', description: 'Create wireframes and mockups for the new manager dashboard.', status: 'done', priority: 'medium', assigneeId: 'user_5', creatorId: 'user_2', dueDate: new Date(Date.now() - 86400000 * 4).toISOString(), estHours: 12, project: 'Frontend', createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  ]

  const comments: Comment[] = [
    { id: 'cmt_1', taskId: 'task_1', authorId: 'user_3', content: 'I\'ve started working on the CSS variable approach in the feature/dark-mode branch. The transition timing should be handled via transition: background-color 0.3s ease on the body element.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), editedAt: null, deleted: false },
    { id: 'cmt_2', taskId: 'task_1', authorId: 'user_2', content: 'Don\'t forget to update the chart colors too — the Recharts components need explicit dark mode palette tokens.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), editedAt: null, deleted: false },
    { id: 'cmt_3', taskId: 'task_1', authorId: 'user_4', content: 'Should we also add a keyboard shortcut? Ctrl+Shift+D would be nice for power users.', createdAt: new Date(Date.now() - 86400000).toISOString(), editedAt: null, deleted: false },
  ]

  const notifications: Notification[] = [
    { id: 'notif_1', userId: 'user_3', type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned to "Review API rate limiting PR"', read: false, taskId: 'task_2', createdAt: new Date().toISOString() },
    { id: 'notif_2', userId: 'user_3', type: 'deadline', title: 'Deadline Approaching', message: '"Implement dark mode toggle" is due in 3 days', read: false, taskId: 'task_1', createdAt: new Date().toISOString() },
    { id: 'notif_3', userId: 'user_3', type: 'comment', title: 'New Comment', message: 'Maya Kapoor commented on "Implement dark mode toggle"', read: true, taskId: 'task_1', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ]

  return {
    users: [admin, jane, alex, raj, maya],
    tasks,
    comments,
    notifications,
    settings: getDefaultSettings(),
    sessions: [{ userId: 'user_1', token: 'tok_' + crypto.randomUUID() }],
    passwords: { ...DEFAULT_HASHES },
    auditEntries: [],
  }
}

class Database {
  private data: StoreSchema
  private loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map()

  constructor() {
    const stored = localStorage.getItem(STORE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const defaults = getDefaultStore()
        this.data = {
          users: parsed.users || defaults.users,
          tasks: parsed.tasks || defaults.tasks,
          comments: parsed.comments || defaults.comments,
          notifications: parsed.notifications || defaults.notifications,
          settings: { ...defaults.settings, ...parsed.settings },
          sessions: parsed.sessions || defaults.sessions,
          passwords: { ...defaults.passwords, ...parsed.passwords },
          auditEntries: parsed.auditEntries || [],
        }
        this.persist()
        return
      } catch { /* fall through */ }
    }
    this.data = getDefaultStore()
    this.persist()
  }

  private persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)) } catch (e) { console.error('db persist failed:', e) }
  }

  get users() { return this.data.users }
  get tasks() { return this.data.tasks }
  get comments() { return this.data.comments }
  get notifications() { return this.data.notifications }
  get settings() { return this.data.settings }
  get sessions() { return this.data.sessions }
  get auditEntries() { return this.data.auditEntries }

  // Auth
  async authenticate(username: string, password: string) {
    const settings = this.data.settings
    const attempt = this.loginAttempts.get(username)
    if (attempt && attempt.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 60000)
      throw new Error(`Account locked. Try again in ${remaining} minute(s).`)
    }

    const user = this.data.users.find(u => u.username === username)
    if (!user) {
      this.recordFailedAttempt(username)
      this.addAuditEntry('login_failed', '', username, `فشل تسجيل الدخول: اسم المستخدم "${username}" غير موجود`)
      return null
    }

    if (!user.active) {
      this.recordFailedAttempt(username)
      this.addAuditEntry('login_failed', user.id, username, `فشل تسجيل الدخول: الحساب "${username}" معطل`)
      throw new Error('Account is deactivated')
    }

    if (user.approved === false) {
      this.recordFailedAttempt(username)
      this.addAuditEntry('login_failed', user.id, username, `فشل تسجيل الدخول: الحساب "${username}" لم يتم الموافقة عليه بعد`)
      throw new Error('Account pending administrator approval')
    }

    const hashed = await hashPassword(password)
    if (this.data.passwords[username] === hashed) {
      this.loginAttempts.delete(username)
      const maxSessions = settings.maxConcurrentSessions
      const userSessions = this.data.sessions.filter(s => s.userId === user.id)
      if (userSessions.length >= maxSessions) {
        this.data.sessions = this.data.sessions.filter(s => s.userId !== user.id)
      }
      const token = 'tok_' + generateId()
      this.data.sessions.push({ userId: user.id, token })
      this.persist()
      this.addAuditEntry('login', user.id, username, `تسجيل دخول ناجح للمستخدم "${username}"`)
      return { user, token }
    }

    this.recordFailedAttempt(username)
    this.addAuditEntry('login_failed', user.id, username, `فشل تسجيل الدخول: كلمة مرور خاطئة للمستخدم "${username}"`)
    return null
  }

  private recordFailedAttempt(username: string) {
    const settings = this.data.settings
    const now = Date.now()
    const attempt = this.loginAttempts.get(username)
    if (attempt && attempt.lockedUntil > now) return
    const count = (attempt ? attempt.count : 0) + 1
    if (count >= settings.lockMaxAttempts) {
      this.loginAttempts.set(username, { count, lockedUntil: now + settings.lockDuration * 60000 })
    } else {
      this.loginAttempts.set(username, { count, lockedUntil: 0 })
    }
  }

  validateSession(token: string) {
    const session = this.data.sessions.find(s => s.token === token)
    if (!session) return null
    return this.data.users.find(u => u.id === session.userId && u.active && u.approved !== false) || null
  }

  deleteSession(token: string) {
    const session = this.data.sessions.find(s => s.token === token)
    this.data.sessions = this.data.sessions.filter(s => s.token !== token)
    this.persist()
    if (session) {
      const user = this.data.users.find(u => u.id === session.userId)
      if (user) {
        this.addAuditEntry('logout', user.id, user.username, `تسجيل خروج المستخدم "${user.username}"`)
      }
    }
  }

  getUsers(): User[] { return this.data.users }

  async createUser(u: Omit<User, 'id' | 'createdAt' | 'approved'> & { approved?: boolean }, password = 'changeme'): Promise<User> {
    if (this.data.users.some(ex => ex.username === u.username)) {
      throw new Error('Username already exists')
    }
    const user: User = { 
      ...u, 
      id: generateId(), 
      createdAt: new Date().toISOString(),
      approved: u.approved !== undefined ? u.approved : true
    }
    this.data.users.push(user)
    this.data.passwords[user.username] = await hashPassword(password)
    this.persist()

    if (user.approved === false) {
      const admins = this.data.users.filter(usr => usr.role === 'admin')
      admins.forEach(adm => {
        this.addNotification({
          userId: adm.id,
          type: 'registration',
          title: 'طلب انضمام جديد',
          message: `طلب الموظف ${user.name} (@${user.username}) الانضمام إلى مساحة العمل.`,
          read: false
        })
      })
    }

    this.addAuditEntry('user_created', user.id, user.username, `إنشاء مستخدم جديد: "${user.username}" (${user.name}) بدور ${user.role}`)
    return user
  }

  async updatePassword(username: string, newPassword: string) {
    if (this.data.passwords[username]) {
      this.data.passwords[username] = await hashPassword(newPassword)
      this.persist()

      const user = this.data.users.find(u => u.username === username)
      if (user) {
        const admins = this.data.users.filter(usr => usr.role === 'admin' && usr.username !== username)
        admins.forEach(adm => {
          this.addNotification({
            userId: adm.id,
            type: 'security_alert',
            title: 'تغيير كلمة المرور',
            message: `قام الموظف ${user.name} بتغيير كلمة المرور الخاصة به.`,
            read: false
          })
        })
      }
    }
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id)
    if (idx === -1) return null
    const oldUser = this.data.users[idx]
    const updated = { ...oldUser, ...updates }
    this.data.users[idx] = updated
    this.persist()

    if (updates.approved === true && oldUser.approved === false) {
      this.addNotification({
        userId: updated.id,
        type: 'approval',
        title: 'تفعيل الحساب',
        message: 'تم تفعيل حسابك، مرحباً بك في الفريق!',
        read: false
      })
      this.addAuditEntry('user_approved', updated.id, updated.username, `تمت الموافقة على حساب "${updated.username}"`)
    }

    if (updates.approved === false && oldUser.approved !== false) {
      this.addAuditEntry('user_rejected', oldUser.id, oldUser.username, `تم رفض حساب "${oldUser.username}"`)
    }

    if (oldUser.approved !== false && (updates.name || updates.email)) {
      const admins = this.data.users.filter(usr => usr.role === 'admin' && usr.id !== id)
      admins.forEach(adm => {
        this.addNotification({
          userId: adm.id,
          type: 'security_alert',
          title: 'تعديل الملف الشخصي',
          message: `قام الموظف ${oldUser.name} بتعديل بياناته الشخصية/الأمان.`,
          read: false
        })
      })
    }

    const changes: string[] = []
    if (updates.name && updates.name !== oldUser.name) changes.push(`الاسم: "${oldUser.name}" ← "${updates.name}"`)
    if (updates.email && updates.email !== oldUser.email) changes.push(`البريد: "${oldUser.email}" ← "${updates.email}"`)
    if (updates.role && updates.role !== oldUser.role) changes.push(`الدور: "${oldUser.role}" ← "${updates.role}"`)
    if (updates.active !== undefined && updates.active !== oldUser.active) changes.push(`الحالة: ${oldUser.active ? 'نشط' : 'غير نشط'} ← ${updates.active ? 'نشط' : 'غير نشط'}`)
    if (changes.length > 0) {
      this.addAuditEntry('user_updated', updated.id, updated.username, `تحديث المستخدم "${updated.username}": ${changes.join(' | ')}`)
    }

    return updated
  }

  deleteUser(id: string) {
    const user = this.data.users.find(u => u.id === id)
    if (user) {
      delete this.data.passwords[user.username]
      this.addAuditEntry('user_deleted', user.id, user.username, `حذف المستخدم "${user.username}" (${user.name})`)
    }
    this.data.users = this.data.users.filter(u => u.id !== id)
    this.persist()
  }

  getTasks(filters?: { status?: string; priority?: string; assigneeId?: string; search?: string; offset?: number; limit?: number }): Task[] {
    let result = [...this.data.tasks]
    if (filters?.status) result = result.filter(t => t.status === filters.status)
    if (filters?.priority) result = result.filter(t => t.priority === filters.priority)
    if (filters?.assigneeId) result = result.filter(t => t.assigneeId === filters.assigneeId)
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(s) || t.code.toLowerCase().includes(s))
    }
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    if (filters?.offset !== undefined || filters?.limit !== undefined) {
      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 50
      result = result.slice(offset, offset + limit)
    }
    return result
  }
  getTask(id: string) { return this.data.tasks.find(t => t.id === id) || null }
  createTask(t: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Task {
    const maxIdx = this.data.tasks.reduce((max, t) => {
      const n = parseInt(t.code.replace('TASK-', ''), 10)
      return n > max ? n : max
    }, 0)
    const task: Task = {
      ...t,
      id: generateId(),
      code: generateTaskCode(maxIdx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.tasks.push(task)
    this.persist()

    if (task.assigneeId) {
      const creator = this.data.users.find(u => u.id === task.creatorId)
      const creatorName = creator ? creator.name : 'المدير'
      this.addNotification({
        userId: task.assigneeId,
        type: 'task_assigned',
        title: 'مهمة جديدة',
        message: `أسنَد إليك المدير ${creatorName} مهمة [${task.title}]`,
        taskId: task.id,
        read: false
      })
    }

    const creator = this.data.users.find(u => u.id === task.creatorId)
    this.addAuditEntry('task_created', task.creatorId, creator?.username || '',
      `إنشاء مهمة "${task.code}: ${task.title}" (${task.priority}) للمسؤول ${task.assigneeId ? this.data.users.find(u => u.id === task.assigneeId)?.name || 'غير معروف' : 'غير محدد'}`)

    return task
  }
  updateTask(id: string, updates: Partial<Task>) {
    const idx = this.data.tasks.findIndex(t => t.id === id)
    if (idx === -1) return null
    const oldTask = this.data.tasks[idx]
    const updatedTask = { ...oldTask, ...updates, updatedAt: new Date().toISOString() }
    this.data.tasks[idx] = updatedTask
    this.persist()

    if (updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId && updates.assigneeId !== null) {
      this.addNotification({
        userId: updates.assigneeId,
        type: 'task_assigned',
        title: 'مهمة جديدة مسندة',
        message: `أسنَد إليك المدير مهمة [${updatedTask.title}]`,
        taskId: updatedTask.id,
        read: false
      })
    }

    if (updates.priority !== undefined && updates.priority !== oldTask.priority) {
      const assignee = this.data.users.find(u => u.id === oldTask.assigneeId)
      const assigneeName = assignee ? assignee.name : 'الموظف'
      this.addNotification({
        userId: updatedTask.creatorId,
        type: 'task_modification',
        title: 'تعديل أولوية المهمة',
        message: `قام ${assigneeName} بتعديل أولوية المهمة [${updatedTask.title}]`,
        taskId: updatedTask.id,
        read: false
      })
    }

    if (updates.status !== undefined && updates.status !== oldTask.status) {
      const assignee = this.data.users.find(u => u.id === oldTask.assigneeId)
      const assigneeName = assignee ? assignee.name : 'الموظف'

      if (updates.status === 'done' || updates.status === 'cancelled') {
        const stateText = updates.status === 'done' ? 'أكمل' : 'ألغى'
        this.addNotification({
          userId: updatedTask.creatorId,
          type: 'task_status',
          title: 'تحديث حالة المهمة',
          message: `${stateText} الموظف ${assigneeName} المهمة [${updatedTask.title}]`,
          taskId: updatedTask.id,
          read: false
        })
      }
    }

    const changes: string[] = []
    if (updates.title && updates.title !== oldTask.title) changes.push(`العنوان: "${oldTask.title}" ← "${updates.title}"`)
    if (updates.status && updates.status !== oldTask.status) changes.push(`الحالة: "${oldTask.status}" ← "${updates.status}"`)
    if (updates.priority && updates.priority !== oldTask.priority) changes.push(`الأولوية: "${oldTask.priority}" ← "${updates.priority}"`)
    if (updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) {
      const oldAssignee = oldTask.assigneeId ? this.data.users.find(u => u.id === oldTask.assigneeId)?.name || 'غير معروف' : 'غير محدد'
      const newAssignee = updates.assigneeId ? this.data.users.find(u => u.id === updates.assigneeId)?.name || 'غير معروف' : 'غير محدد'
      changes.push(`المسؤول: "${oldAssignee}" ← "${newAssignee}"`)
    }
    if (updates.dueDate !== undefined && updates.dueDate !== oldTask.dueDate) changes.push(`تاريخ التسليم: "${oldTask.dueDate || 'بدون'}" ← "${updates.dueDate || 'بدون'}"`)
    if (changes.length > 0) {
      this.addAuditEntry('task_updated', oldTask.creatorId, this.data.users.find(u => u.id === oldTask.creatorId)?.username || '',
        `تحديث المهمة "${oldTask.code}: ${changes[0].length > 50 ? changes[0] : oldTask.title}": ${changes.join(' | ')}`)
    }

    return updatedTask
  }
  deleteTask(id: string) {
    const task = this.data.tasks.find(t => t.id === id)
    this.data.tasks = this.data.tasks.filter(t => t.id !== id)
    this.data.comments = this.data.comments.filter(c => c.taskId !== id)
    this.persist()
    if (task) {
      const user = this.data.users.find(u => u.id === task.creatorId)
      this.addAuditEntry('task_deleted', task.creatorId, user?.username || '',
        `حذف المهمة "${task.code}: ${task.title}"`)
    }
  }

  getComments(taskId: string): Comment[] {
    return this.data.comments.filter(c => c.taskId === taskId && !c.deleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  getComment(id: string) { return this.data.comments.find(c => c.id === id) || null }
  addComment(c: Omit<Comment, 'id' | 'createdAt'>): Comment {
    const comment: Comment = { ...c, id: generateId(), createdAt: new Date().toISOString() }
    this.data.comments.push(comment)
    this.persist()

    const task = this.getTask(comment.taskId)
    if (task) {
      const commenter = this.data.users.find(u => u.id === comment.authorId)
      const commenterName = commenter ? commenter.name : 'شخص ما'
      
      const targetUserId = comment.authorId === task.assigneeId ? task.creatorId : task.assigneeId
      if (targetUserId && targetUserId !== comment.authorId) {
        this.addNotification({
          userId: targetUserId,
          type: 'comment',
          title: 'تعليق جديد',
          message: `أضاف ${commenterName} تعليقاً على المهمة: [${task.title}]`,
          taskId: task.id,
          read: false
        })
      }

      const mentionRegex = /@([a-zA-Z0-9_\u0600-\u06FF]+)/g
      let match
      const processedMentions = new Set<string>()
      while ((match = mentionRegex.exec(comment.content)) !== null) {
        const usernameMentioned = match[1].toLowerCase()
        if (processedMentions.has(usernameMentioned)) continue
        processedMentions.add(usernameMentioned)

        const mentionedUser = this.data.users.find(u => u.username.toLowerCase() === usernameMentioned)
        if (mentionedUser && mentionedUser.id !== comment.authorId) {
          this.addNotification({
            userId: mentionedUser.id,
            type: 'mention',
            title: 'إشارة إليك',
            message: `أشار ${commenterName} إليك في تعليق على المهمة: [${task.title}]`,
            taskId: task.id,
            read: false
          })
        }
      }
    }

    return comment
  }
  updateComment(id: string, content: string) {
    const idx = this.data.comments.findIndex(c => c.id === id)
    if (idx === -1) return null
    this.data.comments[idx].content = content
    this.data.comments[idx].editedAt = new Date().toISOString()
    this.persist()
    return this.data.comments[idx]
  }
  softDeleteComment(id: string) {
    const idx = this.data.comments.findIndex(c => c.id === id)
    if (idx === -1) return
    this.data.comments[idx].deleted = true
    this.persist()
  }

  checkDeadlinesAndOverdue(userId: string) {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const userTasks = this.data.tasks.filter(t => t.assigneeId === userId && t.status !== 'done' && t.status !== 'cancelled')
    
    userTasks.forEach(task => {
      if (task.dueDate) {
        const dueStr = task.dueDate.split('T')[0]
        
        if (dueStr === tomorrowStr) {
          const uniqueKey = `deadline_tomorrow_${task.id}_${dueStr}`
          const exists = this.data.notifications.some(n => n.type === uniqueKey)
          if (!exists) {
            this.addNotification({
              userId,
              type: uniqueKey,
              title: 'تنبيه موعد نهائي',
              message: `الموعد النهائي لمهمة [${task.title}] غداً.`,
              taskId: task.id,
              read: false
            })
          }
        }

        const dueTime = new Date(task.dueDate).getTime()
        if (dueTime < now.getTime()) {
          const uniqueKey = `overdue_${task.id}`
          const exists = this.data.notifications.some(n => n.type === uniqueKey)
          if (!exists) {
            this.addNotification({
              userId: task.creatorId,
              type: uniqueKey,
              title: 'مهمة متأخرة',
              message: `تأخرت المهمة [${task.title}] عن موعد تسليمها.`,
              taskId: task.id,
              read: false
            })
          }
        }
      }
    })
  }

  checkWeeklyDigests(userId: string) {
    const user = this.data.users.find(u => u.id === userId)
    if (!user) return

    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime())
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
      const week1 = new Date(date.getFullYear(), 0, 4)
      return `${date.getFullYear()}-W${1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)}`
    }

    const currentWeek = getWeekNumber(new Date())
    const digestKey = `weekly_digest_${userId}_${currentWeek}`
    const exists = this.data.notifications.some(n => n.type === digestKey)
    if (exists) return

    if (user.role === 'admin' || user.role === 'manager') {
      const activeTasks = this.data.tasks.filter(t => t.status !== 'cancelled')
      const completedTasks = activeTasks.filter(t => t.status === 'done')
      const rate = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0
      this.addNotification({
        userId,
        type: digestKey,
        title: 'ملخص الأداء الأسبوعي للمدير',
        message: `تم إنجاز ${rate}% من إجمالي المهام النشطة في مساحة العمل هذا الأسبوع.`,
        read: false
      })
    } else {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const completedThisWeek = this.data.tasks.filter(t => 
        t.assigneeId === userId && 
        t.status === 'done' && 
        new Date(t.updatedAt).getTime() > oneWeekAgo
      ).length
      
      this.addNotification({
        userId,
        type: digestKey,
        title: 'ملخص الأداء الأسبوعي للموظف',
        message: `تهانينا! لقد أنجزت ${completedThisWeek} مهام هذا الأسبوع بنجاح.`,
        read: false
      })
    }
  }

  getNotifications(userId: string, limit?: number): Notification[] {
    let result = this.data.notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (limit !== undefined) result = result.slice(0, limit)
    return result
  }
  markNotificationRead(id: string) {
    const idx = this.data.notifications.findIndex(n => n.id === id)
    if (idx === -1) return
    this.data.notifications[idx].read = true
    this.persist()
  }
  markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach(n => { if (n.userId === userId) n.read = true })
    this.persist()
  }
  addNotification(n: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const notif: Notification = { ...n, id: generateId(), createdAt: new Date().toISOString() }
    this.data.notifications.push(notif)
    this.persist()
    return notif
  }

  getSettings(): AppSettings { return { ...this.data.settings } }
  updateSettings(s: Partial<AppSettings>, userId?: string, username?: string) {
    const oldSettings = { ...this.data.settings }
    this.data.settings = { ...this.data.settings, ...s }
    this.persist()
    const changed: string[] = []
    for (const key of Object.keys(s)) {
      if ((oldSettings as any)[key] !== (s as any)[key]) {
        changed.push(key)
      }
    }
    if (changed.length > 0 && userId) {
      this.addAuditEntry('settings_updated', userId, username || '',
        `تحديث الإعدادات: ${changed.join(', ')}`)
    }
  }
  resetSettings(userId?: string, username?: string) {
    this.data.settings = getDefaultSettings()
    this.persist()
    if (userId) {
      this.addAuditEntry('settings_reset', userId, username || '',
        'إعادة تعيين جميع الإعدادات إلى القيم الافتراضية')
    }
  }

  addAuditEntry(action: AuditAction, userId: string, username: string, details: string) {
    const entry: AuditEntry = {
      id: generateId(),
      action,
      userId,
      username,
      details,
      timestamp: new Date().toISOString(),
    }
    this.data.auditEntries.push(entry)
    this.purgeOldAuditEntries()
    this.persist()
    return entry
  }

  private purgeOldAuditEntries() {
    const retention = this.data.settings.auditRetentionDays
    const cutoff = Date.now() - retention * 86400000
    this.data.auditEntries = this.data.auditEntries.filter(e => new Date(e.timestamp).getTime() > cutoff)
  }

  getAuditLog(filters?: { action?: string; userId?: string; search?: string; offset?: number; limit?: number }): AuditEntry[] {
    let result = [...this.data.auditEntries]
    if (filters?.action) result = result.filter(e => e.action === filters.action)
    if (filters?.userId) result = result.filter(e => e.userId === filters.userId)
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(e => e.details.toLowerCase().includes(s) || e.username.toLowerCase().includes(s))
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (filters?.offset !== undefined || filters?.limit !== undefined) {
      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 50
      result = result.slice(offset, offset + limit)
    }
    return result
  }

  clearAuditLog(userId?: string, username?: string) {
    if (userId) {
      this.addAuditEntry('audit_log_cleared', userId, username || '', `مسح سجل التدقيق بواسطة "${username || userId}"`)
    }
    this.data.auditEntries = []
    this.persist()
  }

  getReportMetrics(period?: string): ReportMetrics {
    const tasks = this.data.tasks
    const users = this.data.users

    const now = Date.now()
    let filtered = tasks
    if (period && period !== 'All') {
      const cutoffs: Record<string, number> = {
        '7 Days': now - 7 * 86400000,
        '30 Days': now - 30 * 86400000,
        'Quarter': now - 90 * 86400000,
      }
      const cutoff = cutoffs[period]
      if (cutoff) filtered = tasks.filter(t => new Date(t.updatedAt).getTime() >= cutoff)
    }

    const total = filtered.length
    const completedTasks = filtered.filter(t => t.status === 'done')
    const completed = completedTasks.length

    const overdue = filtered.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length

    const completedWithDuration = completedTasks
      .map(t => {
        const created = new Date(t.createdAt).getTime()
        const doneDate = new Date(t.updatedAt).getTime()
        return (doneDate - created) / 86400000
      })
      .filter(d => d > 0)
    const avgResolutionDays = completedWithDuration.length > 0
      ? Math.round((completedWithDuration.reduce((a, b) => a + b, 0) / completedWithDuration.length) * 10) / 10
      : 0

    const tasksByUser: Record<string, number> = {}
    completedTasks.forEach(t => {
      if (t.assigneeId) tasksByUser[t.assigneeId] = (tasksByUser[t.assigneeId] || 0) + 1
    })
    const topPerformers = Object.entries(tasksByUser)
      .map(([userId, count]) => ({
        userId,
        name: users.find(u => u.id === userId)?.name || 'Unknown',
        completed: count,
      }))
      .sort((a, b) => b.completed - a.completed)

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const trendMap: Record<string, number> = {}
    completedTasks.forEach(t => {
      const day = dayNames[new Date(t.updatedAt).getDay()]
      trendMap[day] = (trendMap[day] || 0) + 1
    })
    const trend = dayNames.map(date => ({ date, completed: trendMap[date] || 0 }))

    return {
      totalTasks: total,
      completedTasks: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgResolutionDays,
      overdueTasks: overdue,
      byStatus: [
        { status: 'todo', count: filtered.filter(t => t.status === 'todo').length },
        { status: 'in_progress', count: filtered.filter(t => t.status === 'in_progress').length },
        { status: 'done', count: completed },
        { status: 'cancelled', count: filtered.filter(t => t.status === 'cancelled').length },
      ],
      byPriority: [
        { priority: 'low', count: filtered.filter(t => t.priority === 'low').length },
        { priority: 'medium', count: filtered.filter(t => t.priority === 'medium').length },
        { priority: 'high', count: filtered.filter(t => t.priority === 'high').length },
        { priority: 'critical', count: filtered.filter(t => t.priority === 'critical').length },
      ],
      topPerformers,
      trend,
    }
  }
}

export const db = new Database()
