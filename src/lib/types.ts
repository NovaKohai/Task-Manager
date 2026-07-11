export type Role = 'admin' | 'manager' | 'developer' | 'viewer'
export type Department = 'engineering' | 'qa' | 'it' | 'hr' | 'finance' | 'accounting' | 'marketing' | 'sales' | 'operations' | 'design' | 'legal' | 'customer_support' | 'product'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Permission =
  | 'task.create'
  | 'task.edit'
  | 'task.edit.own'
  | 'task.delete'
  | 'task.assign'
  | 'task.view_all'
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.approve'
  | 'settings.view'
  | 'settings.edit'
  | 'reports.view'
  | 'audit.view'
  | 'announcement.send'

export type User = {
  id: string
  username: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
  avatar?: string
  active: boolean
  approved: boolean
  createdAt: string
  title?: string
  department?: Department
}

export type Task = {
  id: string
  code: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  assigneeId: string | null
  creatorId: string
  dueDate: string | null
  estHours: number | null
  project?: string
  createdAt: string
  updatedAt: string
}

export type Comment = {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: string
  editedAt: string | null
  deleted: boolean
}

export type Notification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  taskId?: string
  dedupKey?: string
  createdAt: string
}

export type ReportMetrics = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  avgResolutionDays: number
  overdueTasks: number
  byStatus: { status: TaskStatus; count: number }[]
  byPriority: { priority: Priority; count: number }[]
  topPerformers: { userId: string; name: string; completed: number }[]
  trend: { date: string; completed: number }[]
}

export type AppSettings = {
  serverName: string
  defaultTimezone: string
  appUrl: string
  pwMinLength: number
  pwMaxLength: number
  requireUppercase: boolean
  requireDigit: boolean
  pwHistory: number
  pwMaxAge: number
  pwHashAlgo: string
  lockMaxAttempts: number
  lockDuration: number
  accessTokenExpiry: number
  refreshTokenExpiry: number
  inactivityTimeout: number
  maxConcurrentSessions: number
  retentionDays: number
  softDeleteDays: number
  auditRetentionDays: number
  enableBackup: boolean
  backupCount: number
  backupPath: string
  authRateLimit: number
  apiRateLimit: number
  enableEmailNotif: boolean
  enablePushNotif: boolean
  enableSlackNotif: boolean
  enableDigest: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export type Session = {
  user: User
  token: string
}

export type AuditAction =
  | 'login' | 'logout' | 'login_failed'
  | 'task_created' | 'task_updated' | 'task_deleted'
  | 'user_created' | 'user_updated' | 'user_deleted'
  | 'user_approved' | 'user_rejected'
  | 'settings_updated' | 'settings_reset'
  | 'audit_log_cleared'

export type AuditEntry = {
  id: string
  action: AuditAction
  userId: string
  username: string
  details: string
  timestamp: string
}

export type SupportTicketStatus = 'pending' | 'in_progress' | 'completed'

export type SupportTicketCategory =
  | 'network'
  | 'software'
  | 'hardware'
  | 'email_account'
  | 'other'

export type SupportTicket = {
  id: string
  creatorId: string
  category: SupportTicketCategory
  description: string
  image?: string
  reminderDate?: string
  status: SupportTicketStatus
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}
