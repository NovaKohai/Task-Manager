import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Permission, User } from './types'
import { i18n } from './i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  return user.permissions.includes(permission)
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return i18n.t('notifications.just_now')
  if (mins < 60) return i18n.t('notifications.min_ago').replace('{m}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return i18n.t('notifications.hour_ago').replace('{h}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 7) return i18n.t('notifications.day_ago').replace('{d}', String(days))
  return d.toLocaleDateString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')
}

export function yieldToUI(): Promise<void> {
  return new Promise(r => setTimeout(r, 0))
}
