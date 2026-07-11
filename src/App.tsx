import { useEffect, lazy, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sparkles, GitCommit } from 'lucide-react'
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

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)
  const isDark = useThemeStore((s) => s.isDark)

  const [updateCommits, setUpdateCommits] = useState<UpdateCommit[]>([])
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [applyingUpdate, setApplyingUpdate] = useState(false)
  const [updateApplied, setUpdateApplied] = useState(false)

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
      if (result.available && result.commits.length > 0 && result.commits[0].hash !== dismissed) {
        setUpdateCommits(result.commits)
        setUpdateDialogOpen(true)
      }
    })()
  }, [])

  async function handleApplyUpdate() {
    if (!window.electronAPI) return
    setApplyingUpdate(true)
    try {
      const result = await window.electronAPI.applyUpdate()
      if (result.success && result.changed) {
        setUpdateApplied(true)
        setUpdateCommits([])
      }
    } finally {
      setApplyingUpdate(false)
    }
  }

  function handleDismiss() {
    if (updateCommits.length > 0) {
      localStorage.setItem('dismissed_update', updateCommits[0].hash)
    }
    setUpdateDialogOpen(false)
    setUpdateCommits([])
  }

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
              {updateApplied
                ? i18n.t('settings.update_success')
                : i18n.t('update.notification_desc')}
            </DialogDescription>
          </DialogHeader>

          {!updateApplied && updateCommits.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-border/20 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {i18n.t('update.changelog')}
              </p>
              {updateCommits.map((c) => (
                <div key={c.hash} className="flex items-start gap-2 text-sm">
                  <GitCommit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-foreground/80">{c.message}</span>
                </div>
              ))}
            </div>
          )}

          {updateApplied ? (
            <DialogFooter>
              <Button onClick={handleDismiss} className="h-9 rounded-full spring-transition">
                {i18n.t('close')}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter className="flex gap-2">
              <Button variant="secondary" onClick={handleDismiss} className="h-9 rounded-full spring-transition">
                {i18n.t('update.later')}
              </Button>
              <Button onClick={handleApplyUpdate} disabled={applyingUpdate} className="h-9 rounded-full spring-transition">
                {applyingUpdate ? i18n.t('settings.applying') : i18n.t('update.now')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </ToastProvider>
  )
}
