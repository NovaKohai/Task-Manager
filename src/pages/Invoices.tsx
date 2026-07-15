import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useLocaleStore } from '@/stores/localeStore'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/lib/utils'
import { InvoiceManager } from '@/components/invoices/InvoiceManager'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'
import { CreateInvoiceDialog } from '@/components/invoices/CreateInvoiceDialog'
import { Button } from '@/components/ui/button'

const EGS_URL = 'https://www.invoicing.egypt.gov.eg'

export default function Invoices() {
  useLocaleStore(s => s.lang)
  const user = useAuthStore((s) => s.user)
  const fetchInvoices = useInvoiceStore(s => s.fetchInvoices)
  const invoices = useInvoiceStore(s => s.invoices)
  const selectedInvoice = useInvoiceStore(s => s.selectedInvoice)
  const setSelectedInvoice = useInvoiceStore(s => s.setSelectedInvoice)

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const canView = user ? hasPermission(user, 'invoices.view') : false
  const egsUrl = window.electronAPI?.egsUrl || EGS_URL

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

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
          <h1 className="text-lg font-bold tracking-tight text-foreground animate-rise stagger-1">{i18n.t('nav.invoices')}</h1>
          <p className="text-caption text-muted-foreground/90 animate-rise stagger-1">
            {i18n.t('invoices.total_invoices').replace('{count}', String(invoices.length))}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(egsUrl, '_blank')}
            className="h-8 rounded-lg text-xs font-semibold gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {i18n.t('invoices.open_portal')}
          </Button>
        </div>
      </div>

      <div className="glass-panel animate-rise stagger-2">
        <div className="glass-panel-inner p-6">
          <InvoiceManager
            onCreateNew={() => setShowCreateDialog(true)}
            onPreview={(id) => {
              const inv = useInvoiceStore.getState().invoices.find(i => i.id === id)
              if (inv) setSelectedInvoice(inv)
            }}
          />
        </div>
      </div>

      {selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          open={true}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <CreateInvoiceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  )
}
