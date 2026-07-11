import type { TaskStatus, Priority } from './types'

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

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
