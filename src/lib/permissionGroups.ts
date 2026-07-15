import type { Permission } from './types'

export type PermissionGroup = {
  labelKey: string
  permissions: Permission[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    labelKey: 'perm.group.tasks',
    permissions: ['task.create', 'task.edit', 'task.edit.own', 'task.delete', 'task.assign', 'task.view_all', 'task.reorder', 'task.verify'],
  },
  {
    labelKey: 'perm.group.users',
    permissions: ['user.view', 'user.create', 'user.edit', 'user.delete', 'user.approve'],
  },
  {
    labelKey: 'perm.group.settings',
    permissions: ['settings.view', 'settings.edit'],
  },
  {
    labelKey: 'perm.group.preferences',
    permissions: ['preferences.view', 'preferences.edit'],
  },
  {
    labelKey: 'perm.group.reports',
    permissions: ['reports.view', 'audit.view'],
  },
  {
    labelKey: 'perm.group.support',
    permissions: ['support.manage', 'support.priority', 'support.diagnostics', 'support.resolution_notes', 'support.feedback'],
  },
  {
    labelKey: 'perm.group.other',
    permissions: ['notifications.view', 'subtask.toggle', 'mention.create', 'effort.view_all', 'announcement.send'],
  },
]
