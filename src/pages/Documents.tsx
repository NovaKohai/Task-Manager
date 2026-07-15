import { useEffect, useState } from 'react'
import { i18n } from '@/lib/i18n'
import { useDocumentStore } from '@/stores/documentStore'
import { useLocaleStore } from '@/stores/localeStore'
import { DocumentManager } from '@/components/documents/DocumentManager'
import { AuditLogSidebar } from '@/components/documents/AuditLogSidebar'
import { RecycleBin } from '@/components/documents/RecycleBin'
import { DepartmentSelect } from '@/components/ui/DepartmentSelect'
import { hasPermission } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Department } from '@/lib/types'

export default function Documents() {
  useLocaleStore(s => s.lang)
  const user = useAuthStore((s) => s.user)
  const {
    fetchDocuments, fetchActivityLog, activityLog,
    deletedFiles, deletedFolders, restoreFile, permanentDeleteFile,
    restoreFolder, permanentDeleteFolder,
    setDepartmentFilter, departmentFilter,
  } = useDocumentStore()

  const [showActivity, setShowActivity] = useState(false)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const canView = user ? hasPermission(user, 'documents.view') : false

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments, departmentFilter])

  const handleOpenActivityLog = (fileId?: string) => {
    fetchActivityLog(fileId)
    setShowActivity(true)
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        {i18n.t('no_permission')}
      </div>
    )
  }

  return (
    <div className="space-y-6 page-bg relative min-h-[calc(100vh-8rem)]">
      <div aria-hidden="true" className="absolute inset-0 dotted-bg pointer-events-none" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground animate-rise stagger-1">{i18n.t('nav.documents')}</h1>
          <p className="text-caption text-muted-foreground/90 animate-rise stagger-1">{i18n.t('documents.subtitle')}</p>
        </div>
        {user?.role === 'admin' && (
          <div className="animate-rise stagger-2">
            <DepartmentSelect
              value={departmentFilter || ''}
              onValueChange={(val) => setDepartmentFilter(val ? val as Department : null)}
            />
          </div>
        )}
      </div>

      {showRecycleBin ? (
        <div className="glass-panel animate-rise stagger-2">
          <div className="glass-panel-inner">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground">{i18n.t('documents.recycle_bin')}</h2>
              <button onClick={() => setShowRecycleBin(false)} className="text-xs font-semibold text-primary hover:underline">{i18n.t('back')}</button>
            </div>
            <RecycleBin
              files={deletedFiles}
              folders={deletedFolders}
              onRestore={restoreFile}
              onPermanentDelete={permanentDeleteFile}
              onRestoreFolder={restoreFolder}
              onPermanentDeleteFolder={permanentDeleteFolder}
            />
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-rise stagger-2">
          <div className="glass-panel-inner">
            <DocumentManager
              onOpenRecycleBin={() => setShowRecycleBin(true)}
              onOpenActivityLog={handleOpenActivityLog}
            />
          </div>
        </div>
      )}

      <AuditLogSidebar logs={activityLog} open={showActivity} onClose={() => setShowActivity(false)} />
    </div>
  )
}
