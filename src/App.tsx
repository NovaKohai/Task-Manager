import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { initUpdateCheck } from '@/stores/updateStore'
import { Toaster } from '@/components/ui/toaster'
import { UpdateDialog } from '@/components/UpdateDialog'
import AppShell from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { db } from '@/lib/db'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const ManagerDashboard = lazy(() => import('@/pages/ManagerDashboard'))
const MyDashboard = lazy(() => import('@/pages/MyDashboard'))
const TaskList = lazy(() => import('@/pages/TaskList'))
const CreateTask = lazy(() => import('@/pages/CreateTask'))
const TaskDetail = lazy(() => import('@/pages/TaskDetail'))
const Reports = lazy(() => import('@/pages/Reports'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const PreferencesPage = lazy(() => import('@/pages/Preferences'))
const AdminUsers = lazy(() => import('@/pages/AdminUsers'))
const AuditLog = lazy(() => import('@/pages/AuditLog'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Focus = lazy(() => import('@/pages/Focus'))
const Profile = lazy(() => import('@/pages/Profile'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const SupportPage = lazy(() => import('@/pages/Support'))
const ChatPage = lazy(() => import('@/pages/Chat'))
const ITApps = lazy(() => import('@/pages/ITApps'))
const DocumentsPage = lazy(() => import('@/pages/Documents'))
const InvoicesPage = lazy(() => import('@/pages/Invoices'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    initUpdateCheck()
  }, [])

  useEffect(() => {
    const user = useAuthStore.getState().user
    if (user) {
      const prefs = db.getUserPreferences(user.id)
      const root = document.documentElement
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
      root.classList.add(`font-size-${prefs.fontSize}`)
      root.classList.toggle('compact-mode', prefs.compactMode)
    }
  })

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>} />
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/my-dashboard" element={<MyDashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/create" element={<CreateTask />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit-log" element={<AuditLog />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/focus/:taskId" element={<Focus />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/it-apps" element={<ITApps />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
          </Route>
        </Routes>
        <Toaster />
        <UpdateDialog />
      </HashRouter>
    </ErrorBoundary>
  )
}
