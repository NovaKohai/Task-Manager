type Event = {
  name: string
  ts: string
  meta?: Record<string, string | number>
}

function isOptedIn(): boolean {
  return localStorage.getItem('ttm_analytics_optin') === 'true'
}

export function setAnalyticsOptIn(enabled: boolean) {
  localStorage.setItem('ttm_analytics_optin', String(enabled))
}

export function isAnalyticsOptedIn(): boolean {
  return isOptedIn()
}

export function track(event: string, meta?: Record<string, string | number>) {
  if (!isOptedIn()) return
  try {
    const stored = localStorage.getItem('ttm_analytics_events')
    const events: Event[] = stored ? JSON.parse(stored) : []
    events.push({ name: event, ts: new Date().toISOString(), meta })
    localStorage.setItem('ttm_analytics_events', JSON.stringify(events.slice(-500)))
  } catch { /* silently fail */ }
}

export function getAnalyticsEvents(): Event[] {
  try {
    const stored = localStorage.getItem('ttm_analytics_events')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function clearAnalyticsEvents() {
  localStorage.removeItem('ttm_analytics_events')
}
