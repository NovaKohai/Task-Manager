import { i18n } from './i18n'

export function validateEmail(email: string): string | null {
  if (!email.trim()) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim())) return i18n.t('register.error_email_invalid')
  return null
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return i18n.t('register.error_phone_invalid')
  return null
}

export function validateDate(dateStr: string): string | null {
  if (!dateStr.trim()) return null
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!dateRegex.test(dateStr)) return i18n.t('register.error_date_invalid')
  const parts = dateStr.split('/')
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  const d = new Date(year, month, day)
  const isValidDate = d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  const currentYear = new Date().getFullYear()
  if (!isValidDate || year < 1900 || year > currentYear) return i18n.t('register.error_date_invalid')
  return null
}

export function validatePassword(password: string, minLength = 8): string | null {
  if (password && password.length < minLength) {
    return i18n.t('register.password_too_short').replace('{min}', String(minLength))
  }
  return null
}

export function validateName(name: string): string | null {
  if (!name.trim()) return i18n.t('profile.name_required')
  return null
}

export function validateUsername(username: string): string | null {
  if (!username.trim()) return i18n.t('profile.username_required')
  return null
}
