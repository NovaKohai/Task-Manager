export function minutesBetween(start: Date | string, end: Date | string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return Math.max(0, Math.round((endMs - startMs) / 60000))
}

export function durationLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatClock(mm: number): string {
  const m = Math.max(0, Math.floor(mm))
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${String(h).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${String(r).padStart(2, '0')}:00`
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function startOfWeekISO(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
