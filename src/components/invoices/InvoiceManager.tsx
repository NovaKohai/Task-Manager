import { useState } from 'react'
import { Search, FileText, Eye, Trash2, CheckCircle, Plus } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { hasPermission } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { InvoiceStatus } from '@/lib/types'

const statusConfig: Record<InvoiceStatus, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'; labelKey: string }> = {
  draft: { variant: 'default', labelKey: 'invoices.status.draft' },
  sent: { variant: 'primary', labelKey: 'invoices.status.sent' },
  paid: { variant: 'success', labelKey: 'invoices.status.paid' },
  overdue: { variant: 'danger', labelKey: 'invoices.status.overdue' },
  cancelled: { variant: 'outline', labelKey: 'invoices.status.cancelled' },
}

interface InvoiceManagerProps {
  onCreateNew: () => void
  onPreview: (id: string) => void
}

export function InvoiceManager({ onCreateNew, onPreview }: InvoiceManagerProps) {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const {
    invoices, statusFilter, searchQuery,
    setStatusFilter, setSearchQuery, fetchInvoices,
    deleteInvoice, markPaid,
  } = useInvoiceStore()

  const [search, setSearch] = useState(searchQuery)
  const canManage = user ? hasPermission(user, 'invoices.manage') : false

  const handleSearch = () => {
    setSearchQuery(search)
    fetchInvoices()
  }

  const handleStatusFilter = (s: InvoiceStatus | null) => {
    setStatusFilter(s)
    setTimeout(() => fetchInvoices(), 0)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder={i18n.t('invoices.search_placeholder')}
              className="h-9 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>
        {canManage && (
          <Button size="sm" onClick={onCreateNew} className="h-9 rounded-lg text-xs font-semibold">
            <Plus className="h-3.5 w-3.5" />
            {i18n.t('invoices.create')}
          </Button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => handleStatusFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold spring-transition border ${!statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/30 hover:text-foreground'}`}
        >
          {i18n.t('invoices.all')}
        </button>
        {(Object.keys(statusConfig) as InvoiceStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold spring-transition border ${statusFilter === status ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/30 hover:text-foreground'}`}
          >
            {i18n.t(statusConfig[status].labelKey)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {invoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={i18n.t('invoices.no_invoices')}
            description={i18n.t('invoices.no_invoices_desc')}
          />
        ) : (
          invoices.map((inv) => {
            const cfg = statusConfig[inv.status]
            return (
              <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/10 spring-transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{inv.number}</span>
                    <Badge variant={cfg.variant} className="rounded-full text-micro px-2">{i18n.t(cfg.labelKey)}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{inv.clientName}</p>
                  <p className="text-micro text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString()} · {i18n.t('invoices.total')}: ${inv.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => onPreview(inv.id)} title={i18n.t('invoices.preview')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {canManage && inv.status === 'sent' && (
                    <Button variant="ghost" size="icon" onClick={() => { markPaid(inv.id); toast({ description: i18n.t('invoices.paid_toast').replace('{number}', inv.number), variant: 'success' }) }} title={i18n.t('invoices.mark_paid')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-success">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canManage && (
                    <Button variant="ghost" size="icon" onClick={() => { deleteInvoice(inv.id); toast({ description: i18n.t('invoices.deleted_toast').replace('{number}', inv.number), variant: 'default' }) }} title={i18n.t('invoices.delete')} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
