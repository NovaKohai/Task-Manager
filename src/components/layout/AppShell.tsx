import { useEffect, Suspense } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { i18n } from '@/lib/i18n'
import { useOsNotifications } from '@/hooks/useOsNotifications'
import { hasPermission } from '@/lib/utils'
import { useLocaleStore } from '@/stores/localeStore'
import { toast } from '@/hooks/use-toast'

export default function AppShell() {
  // Subscribe so this component re-renders on locale flips — without a reload.
  useLocaleStore((s) => s.lang)

  useEffect(() => {
    const handlePersistError = () => {
      toast({
        title: i18n.t('error.data_persist.title'),
        description: i18n.t('error.data_persist.desc'),
        variant: 'destructive',
      })
    }
    window.addEventListener('ttm_persist_error', handlePersistError)
    return () => window.removeEventListener('ttm_persist_error', handlePersistError)
  }, [])
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
    // /settings requires the settings.view permission. Users without it
    // are redirected to the dashboard (or their default landing page).
    if (
      !isLoading && user &&
      location.pathname.startsWith('/settings') &&
      !hasPermission(user, 'settings.view')
    ) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, isLoading, location.pathname, navigate])

  useEffect(() => {
    if (
      !isLoading && user &&
      location.pathname.startsWith('/preferences') &&
      !hasPermission(user, 'preferences.view')
    ) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, isLoading, location.pathname, navigate])

  useEffect(() => {
    if (user && !localStorage.getItem('ttm_onboarding_done') && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [user, location.pathname, navigate])

  useEffect(() => {
    if (user) refreshNotifications(user.id)
    const handleRealtimeUpdate = () => {
      if (user) refreshNotifications(user.id)
    }
    window.addEventListener('ttm_realtime_update', handleRealtimeUpdate)
    return () => window.removeEventListener('ttm_realtime_update', handleRealtimeUpdate)
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

  return (
    <div dir={i18n.dir} className="flex min-h-screen bg-background">
      <div className="bg-glow fixed top-[-200px] right-[-200px] opacity-70" />
      <div className="bg-glow fixed bottom-[-200px] left-[-200px] opacity-50" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground">
        {i18n.t('skip_to_content')}
      </a>
      <Sidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
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
              <div key={location.pathname} className="animate-fade">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
