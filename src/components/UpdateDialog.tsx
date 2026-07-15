import { Sparkles, Download } from 'lucide-react'
import { useUpdateStore } from '@/stores/updateStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { i18n } from '@/lib/i18n'

export function UpdateDialog() {
  const status = useUpdateStore(s => s.status)
  const info = useUpdateStore(s => s.info)
  const progress = useUpdateStore(s => s.progress)
  const dialogOpen = useUpdateStore(s => s.dialogOpen)
  const closeDialog = useUpdateStore(s => s.closeDialog)
  const download = useUpdateStore(s => s.download)
  const install = useUpdateStore(s => s.install)
  const dismiss = useUpdateStore(s => s.dismiss)

  function handleDismiss() {
    dismiss(info?.version)
    closeDialog()
  }

  async function handleDownload() {
    if (!window.electronAPI) return
    await download()
  }

  function handleInstall() {
    if (!window.electronAPI) return
    install()
  }

  const showDownloadButton = status === 'idle'
  const showProgress = status === 'downloading'
  const showInstallButton = status === 'downloaded'

  if (!dialogOpen) return null

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { dismiss(info?.version); closeDialog() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {i18n.t('update.notification_title')}
          </DialogTitle>
          <DialogDescription>
            {i18n.t('update.notification_desc')} {info?.version ? `v${info.version}` : ''}
          </DialogDescription>
        </DialogHeader>

        {info?.releaseNotes && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border/20 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {i18n.t('update.changelog')}
            </p>
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {info.releaseNotes}
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

        {status === 'error' && (
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
  )
}
