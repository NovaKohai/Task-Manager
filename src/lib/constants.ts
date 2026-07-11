import type { TaskStatus, Priority, Role, Department } from './types'

export const priorityBadge: Record<Priority, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' }> = {
  low: { label: 'priority.low', variant: 'primary' },
  medium: { label: 'priority.medium', variant: 'success' },
  high: { label: 'priority.high', variant: 'warning' },
  critical: { label: 'priority.critical', variant: 'danger' },
}

export const statusBadge: Record<TaskStatus, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  todo: { label: 'task.status.todo', variant: 'default' },
  in_progress: { label: 'task.status.in_progress', variant: 'primary' },
  done: { label: 'task.status.done', variant: 'success' },
  cancelled: { label: 'task.status.cancelled', variant: 'danger' },
}

export const roleBadge: Record<Role, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'> = {
  admin: 'danger',
  manager: 'warning',
  developer: 'success',
  viewer: 'outline',
}

export const departmentConfig: Record<Department, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' }> = {
  engineering: { label: 'department.engineering', variant: 'primary' },
  qa: { label: 'department.qa', variant: 'success' },
  it: { label: 'department.it', variant: 'warning' },
  hr: { label: 'department.hr', variant: 'danger' },
  finance: { label: 'department.finance', variant: 'default' },
  accounting: { label: 'department.accounting', variant: 'outline' },
  marketing: { label: 'department.marketing', variant: 'primary' },
  sales: { label: 'department.sales', variant: 'success' },
  operations: { label: 'department.operations', variant: 'warning' },
  design: { label: 'department.design', variant: 'danger' },
  legal: { label: 'department.legal', variant: 'outline' },
  customer_support: { label: 'department.customer_support', variant: 'default' },
  product: { label: 'department.product', variant: 'success' },
}

export function getDepartmentConfig(key: string): { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' } {
  if (key in departmentConfig) return departmentConfig[key as Department]
  return { label: key, variant: 'outline' }
}

export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
