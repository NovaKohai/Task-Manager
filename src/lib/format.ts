import type { User } from './types'
import { i18n } from './i18n'

export type UserLike = Pick<User, 'id' | 'name' | 'username'>

export function formatDate(d: string | null | undefined, fallback = '—'): string {
  if (!d) return fallback
  return new Date(d).toLocaleDateString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')
}

export function formatTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFull(d: string | null | undefined, fallback = '—'): string {
  if (!d) return fallback
  return new Date(d).toLocaleDateString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function findUser<T extends UserLike>(users: T[], id: string | null | undefined): T | null {
  if (!id) return null
  return users.find((u) => u.id === id) ?? null
}

export function getUserName<T extends UserLike>(users: T[], id: string | null | undefined, fallback = '—'): string {
  const user = findUser(users, id)
  return user?.name ?? id ?? fallback
}
