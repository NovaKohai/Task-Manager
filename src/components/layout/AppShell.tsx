import { useEffect, Suspense } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { i18n } from '@/lib/i18n'
import { useOsNotifications } from '@/hooks/useOsNotifications'

export default function AppShell() {
  const user = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  const logout = useAuthStore(s => s.logout)
  const notifications = useNotificationStore(s => s.notifications)
  const unreadCount = useNotificationStore(s => s.unreadCount)
  const refreshNotifications = useNotificationStore(s => s.refreshNotifications)
  const navigate = useNavigate()
  const location = useLocation()

  useOsNotifications(notifications)

  useEffect(() => {
    if (!isLoading && !user) navigate('/login', { replace: true })
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (user && !localStorage.getItem('ttm_onboarding_done') && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [user, location.pathname, navigate])

  useEffect(() => {
    if (user) refreshNotifications(user.id)
  }, [user, refreshNotifications])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{i18n.t('loading')}</p>
        </div>
      </div>
    )
  }

  function handleLogout() { logout(); navigate('/login', { replace: true }) }

  const isRtl = i18n.lang === 'ar'

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-screen bg-background">
      <div className="bg-glow fixed top-[-200px] right-[-200px] opacity-70" />
      <div className="bg-glow fixed bottom-[-200px] left-[-200px] opacity-50" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground">
        {i18n.t('skip_to_content')}
      </a>
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex flex-1 flex-col ms-60">
        <Header user={user} unreadCount={unreadCount} />
        <main id="main" role="main" className="flex-1 p-4 md:p-6 lg:p-8 relative">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">{i18n.t('loading')}</p>
                </div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
