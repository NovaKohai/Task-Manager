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
  return d.toLocaleDateString(i18n.localeStr)
}

export function yieldToUI(): Promise<void> {
  return new Promise(r => setTimeout(r, 0))
}

export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 12)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(+${digits}`
  if (digits.length <= 5) return `(+${digits.slice(0, 3)}) ${digits.slice(3)}`
  if (digits.length <= 8) return `(+${digits.slice(0, 3)}) ${digits.slice(3, 5)} ${digits.slice(5)}`
  return `(+${digits.slice(0, 3)}) ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`
}

export function formatDate(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
