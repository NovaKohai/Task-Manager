import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import type { InvoiceItem } from '@/lib/types'

interface CreateInvoiceDialogProps {
  open: boolean
  onClose: () => void
}

interface ItemRow {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

function createItem(): ItemRow {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
}

export function CreateInvoiceDialog({ open, onClose }: CreateInvoiceDialogProps) {
  const { toast } = useToast()
  const createInvoice = useInvoiceStore(s => s.createInvoice)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<ItemRow[]>([createItem()])
  const [error, setError] = useState('')

  const updateItem = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems(prev => [...prev, createItem()])
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id))

  const resetForm = () => {
    setClientName('')
    setClientEmail('')
    setClientAddress('')
    setTaxRate(0)
    setNotes('')
    setDueDate('')
    setItems([createItem()])
    setError('')
  }

  const handleSave = (status: 'draft' | 'sent') => {
    if (!clientName.trim() || !clientEmail.trim() || !dueDate) {
      setError(i18n.t('invoices.form_error'))
      return
    }
    const validItems = items.filter(i => i.description.trim() && i.quantity > 0 && i.unitPrice > 0)
    if (validItems.length === 0) {
      setError(i18n.t('invoices.form_error'))
      return
    }

    const computedItems: InvoiceItem[] = validItems.map(i => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.quantity * i.unitPrice,
    }))
    const subtotal = computedItems.reduce((sum, i) => sum + i.total, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const created = createInvoice({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientAddress: clientAddress.trim(),
      items: computedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: notes.trim(),
      status,
      dueDate: new Date(dueDate).toISOString(),
    })

    toast({ description: i18n.t(status === 'sent' ? 'invoices.sent_toast' : 'invoices.draft_saved_toast').replace('{number}', created.number), variant: 'success' })
    resetForm()
    onClose()
  }

  const total = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)
  const taxAmount = total * (taxRate / 100)
  const grandTotal = total + taxAmount

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose() } }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{i18n.t('invoices.new_invoice')}</DialogTitle>
          <DialogDescription>{i18n.t('invoices.subtitle')}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{i18n.t('invoices.client_info')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.client_name')}</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={i18n.t('invoices.client_name')} className="h-9 text-xs rounded-lg" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.client_email')}</label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={i18n.t('invoices.client_email')} className="h-9 text-xs rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.client_address')}</label>
                <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder={i18n.t('invoices.client_address')} className="h-9 text-xs rounded-lg" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.due_date')}</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs rounded-lg" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{i18n.t('invoices.invoice_items')}</p>
              <Button variant="ghost" size="sm" onClick={addItem} className="h-7 rounded-lg text-xs gap-1">
                <Plus className="h-3 w-3" />
                {i18n.t('invoices.add_item')}
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder={i18n.t('invoices.item_description')}
                    className="h-9 text-xs rounded-lg flex-1 min-w-0"
                  />
                  <Input
                    type="number" min={0}
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder={i18n.t('invoices.item_qty')}
                    className="h-9 text-xs rounded-lg w-16 text-center"
                  />
                  <Input
                    type="number" min={0} step={0.01}
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder={i18n.t('invoices.item_price')}
                    className="h-9 text-xs rounded-lg w-24 text-right"
                  />
                  <span className="text-xs font-semibold text-foreground w-20 text-right shrink-0">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{i18n.t('invoices.additional')}</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-32">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.tax_rate')} (%)</label>
                <Input type="number" min={0} max={100} step={0.1} value={taxRate || ''} onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))} className="h-9 text-xs rounded-lg" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{i18n.t('invoices.notes')}</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={i18n.t('invoices.notes')} className="h-9 text-xs rounded-lg" />
            </div>
          </div>

          <div className="border-t border-border/10 pt-3 flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{i18n.t('invoices.subtotal')}</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{i18n.t('invoices.tax')} ({taxRate}%)</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/20 pt-1 text-sm">
                <span className="font-bold">{i18n.t('invoices.total')}</span>
                <span className="font-bold">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
          <Button variant="secondary" size="sm" onClick={() => { resetForm(); onClose() }} className="h-9 rounded-lg text-xs">
            {i18n.t('cancel')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleSave('draft')} className="h-9 rounded-lg text-xs">
            {i18n.t('invoices.save_draft')}
          </Button>
          <Button size="sm" onClick={() => handleSave('sent')} className="h-9 rounded-lg text-xs">
            {i18n.t('invoices.send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
