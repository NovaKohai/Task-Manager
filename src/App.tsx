import { useEffect, lazy, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sparkles, Download } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { i18n } from '@/lib/i18n'
import AppShell from '@/components/layout/AppShell'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const ManagerDashboard = lazy(() => import('@/pages/ManagerDashboard'))
const MyDashboard = lazy(() => import('@/pages/MyDashboard'))
const TaskList = lazy(() => import('@/pages/TaskList'))
const CreateTask = lazy(() => import('@/pages/CreateTask'))
const TaskDetail = lazy(() => import('@/pages/TaskDetail'))
const Reports = lazy(() => import('@/pages/Reports'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const AdminUsers = lazy(() => import('@/pages/AdminUsers'))
const AuditLog = lazy(() => import('@/pages/AuditLog'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Profile = lazy(() => import('@/pages/Profile'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)
  const isDark = useThemeStore((s) => s.isDark)

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateState, setUpdateState] = useState<'idle' | 'downloading' | 'downloaded' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    (async () => {
      if (!window.electronAPI) return
      const dismissed = localStorage.getItem('dismissed_update')
      const result = await window.electronAPI.checkForUpdates()
      if (result.available && result.version !== dismissed) {
        setUpdateInfo(result)
        setUpdateDialogOpen(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return
    const cleanup = window.electronAPI.onUpdateStatus((status) => {
      if (status.type === 'progress') {
        setProgress(status.percent)
        setUpdateState('downloading')
      } else if (status.type === 'downloaded') {
        setUpdateState('downloaded')
      } else if (status.type === 'error') {
        setUpdateState('error')
      }
    })
    return cleanup
  }, [])

  async function handleDownload() {
    if (!window.electronAPI) return
    setUpdateState('downloading')
    await window.electronAPI.downloadUpdate()
  }

  function handleInstall() {
    if (!window.electronAPI) return
    window.electronAPI.installUpdate()
  }

  function handleDismiss() {
    if (updateInfo?.version) {
      localStorage.setItem('dismissed_update', updateInfo.version)
    }
    setUpdateDialogOpen(false)
    setUpdateInfo(null)
  }

  const showDownloadButton = updateState === 'idle'
  const showProgress = updateState === 'downloading'
  const showInstallButton = updateState === 'downloaded'

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/my-dashboard" element={<MyDashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/create" element={<CreateTask />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit-log" element={<AuditLog />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
        </Routes>
      </HashRouter>
      <ToastViewport />

      <Dialog open={updateDialogOpen} onOpenChange={(o) => { if (!o) handleDismiss() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {i18n.t('update.notification_title')}
            </DialogTitle>
            <DialogDescription>
              {i18n.t('update.notification_desc')} {updateInfo?.version ? `v${updateInfo.version}` : ''}
            </DialogDescription>
          </DialogHeader>

          {updateInfo?.releaseNotes && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/20 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                {i18n.t('update.changelog')}
              </p>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}

          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4 animate-bounce" />
                {i18n.t('settings.applying')} {progress}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {updateState === 'error' && (
            <p className="text-sm text-destructive">{i18n.t('error.generic')}</p>
          )}

          <DialogFooter className="flex gap-2">
            {showDownloadButton && (
              <>
                <Button variant="secondary" onClick={handleDismiss} className="h-9 rounded-full spring-transition">
                  {i18n.t('update.later')}
                </Button>
                <Button onClick={handleDownload} className="h-9 rounded-full spring-transition">
                  {i18n.t('update.now')}
                </Button>
              </>
            )}
            {showInstallButton && (
              <>
                <Button variant="secondary" onClick={handleDismiss} className="h-9 rounded-full spring-transition">
                  {i18n.t('update.later')}
                </Button>
                <Button onClick={handleInstall} className="h-9 rounded-full spring-transition">
                  {i18n.t('settings.restart_hint')}
                </Button>
              </>
            )}
            {showProgress && (
              <Button variant="secondary" disabled className="h-9 rounded-full spring-transition">
                {i18n.t('settings.applying')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToastProvider>
  )
}
