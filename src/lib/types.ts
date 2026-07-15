export type Role = 'admin' | 'manager' | 'developer' | 'viewer'
export type Department = 'engineering' | 'qa' | 'it' | 'hr' | 'finance' | 'accounting' | 'marketing' | 'sales' | 'operations' | 'design' | 'legal' | 'customer_support' | 'product'
export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Language = 'en' | 'ar'

export type LocaleConfig = {
  lang: Language
  label: string
  localeStr: string
  dir: 'ltr' | 'rtl'
}

export type Permission =
  | 'task.create'
  | 'task.edit'
  | 'task.edit.own'
  | 'task.delete'
  | 'task.assign'
  | 'task.view_all'
  | 'task.reorder'
  | 'task.verify'
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.approve'
  | 'settings.view'
  | 'settings.edit'
  | 'preferences.view'
  | 'preferences.edit'
  | 'reports.view'
  | 'audit.view'
  | 'announcement.send'
  | 'support.manage'
  | 'support.priority'
  | 'support.diagnostics'
  | 'support.resolution_notes'
  | 'support.feedback'
  | 'notifications.view'
  | 'subtask.toggle'
  | 'mention.create'
  | 'effort.view_all'
  | 'it.apps.view'
  | 'it.apps.manage'
  | 'documents.view'
  | 'documents.manage'
  | 'invoices.view'
  | 'invoices.manage'

export type User = {
  id: string
  username: string
  name: string
  email?: string
  role: Role
  permissions: Permission[]
  avatar?: string
  active: boolean
  approved: boolean
  createdAt: string
  title?: string
  department?: Department
  phone?: string
  birthDate?: string
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
  parentTaskId?: string
  kanbanOrder?: number
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

export type NotificationType =
  | 'announcement'
  | 'mention'
  | 'assignment'
  | 'task_assigned'
  | 'task_modification'
  | 'task_status'
  | 'comment'
  | 'deadline'
  | 'deadline_tomorrow'
  | 'overdue'
  | 'digest'
  | 'weekly_digest'
  | 'security'
  | 'security_alert'
  | 'qa_review'
  | 'registration'
  | 'approval'
  | 'support_ticket'
  | 'support_status_update'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  taskId?: string
  dedupKey?: string
  createdAt: string
}

export type TimeEntryKind = 'focus' | 'break'

export type TimeEntry = {
  id: string
  taskId: string
  userId: string
  startedAt: string
  endedAt: string | null
  durationMinutes: number
  kind: TimeEntryKind
  notes?: string
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
  supportEnablePriority: boolean
  supportEnableDiagnostics: boolean
  supportEnableResolutionNotes: boolean
  supportEnableFeedback: boolean
}

export type FontSize = 'small' | 'medium' | 'large'

export type UserPreferences = {
  enableEmailNotif: boolean
  enablePushNotif: boolean
  enableSlackNotif: boolean
  enableDigest: boolean
  quietHoursStart: string
  quietHoursEnd: string
  workDurationMin: number
  shortBreakMin: number
  longBreakMin: number
  longBreakInterval: number
  enableSoundNotif: boolean
  soundNotifVolume: number
  soundNotifTheme: string
  fontSize: FontSize
  compactMode: boolean
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
  | 'user_activated' | 'user_deactivated'
  | 'password_changed'
  | 'profile_updated'
  | 'broadcast_sent'
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

export type RecommendedApp = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  officialSite: string
  downloadUrl: string
  notes: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type SupportTicketStatus = 'pending' | 'in_progress' | 'completed'

export type SupportTicketCategory =
  | 'network'
  | 'software'
  | 'hardware'
  | 'email_account'
  | 'other'

export type SupportTicketComment = {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export type SupportTicket = {
  id: string
  creatorId: string
  category: SupportTicketCategory
  description: string
  image?: string
  deviceInfo?: string
  systemLog?: string
  status: SupportTicketStatus
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  priority?: Priority
  resolutionNotes?: string
  rating?: number
  feedbackText?: string
  comments?: SupportTicketComment[]
}

export type ChatRequest = {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export type ChatMessage = {
  id: string
  senderId: string
  receiverId: string
  text: string
  createdAt: string
}

export type DocumentAction = 'created' | 'uploaded' | 'renamed' | 'moved' | 'copied' | 'deleted' | 'restored' | 'permanently_deleted'

export type DocumentFile = {
  id: string
  name: string
  folderId: string
  department: Department
  size: number
  type: string
  url: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type DocumentFolder = {
  id: string
  name: string
  parentId: string | null
  department: Department
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ActivityLog = {
  id: string
  action: DocumentAction
  fileId: string
  fileName: string
  userId: string
  username: string
  details: string
  timestamp: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export type Invoice = {
  id: string
  number: string
  clientName: string
  clientEmail: string
  clientAddress: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string
  status: InvoiceStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate: string
  paidAt: string | null
}
