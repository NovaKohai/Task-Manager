import { useCallback } from 'react'
import { X, Download, Printer } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import type { Invoice } from '@/lib/types'

interface InvoicePreviewProps {
  invoice: Invoice
  open: boolean
  onClose: () => void
}

export function InvoicePreview({ invoice, open, onClose }: InvoicePreviewProps) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadPdf = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 190
    let y = 20

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 14, y)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.number, doc.getTextWidth('INVOICE') + 20, y)

    y += 12
    doc.setFontSize(9)
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, y)
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, y + 4)

    y += 14
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(invoice.clientName, 14, y + 5)
    doc.text(invoice.clientEmail, 14, y + 9)
    const addrLines = invoice.clientAddress ? doc.splitTextToSize(invoice.clientAddress, 80) : []
    if (invoice.clientAddress) {
      doc.text(addrLines, 14, y + 13)
    }

    y += invoice.clientAddress ? 20 + addrLines.length * 4 : 18

    autoTable(doc, {
      startY: y,
      head: [['#', i18n.t('invoices.item'), i18n.t('invoices.qty'), i18n.t('invoices.unit_price'), i18n.t('invoices.total')]],
      body: invoice.items.map((item, i) => [
        String(i + 1),
        item.description,
        String(item.quantity),
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.total.toFixed(2)}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    })

    const finalY = (doc as any).lastAutoTable.finalY || y + 30
    doc.setFontSize(10)
    doc.text(i18n.t('invoices.subtotal'), 140, finalY + 8)
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 180, finalY + 8, { align: 'right' })
    doc.text(`${i18n.t('invoices.tax')} (${invoice.taxRate}%)`, 140, finalY + 14)
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 180, finalY + 14, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(i18n.t('invoices.total'), 140, finalY + 22)
    doc.text(`$${invoice.total.toFixed(2)}`, 180, finalY + 22, { align: 'right' })

    if (invoice.notes) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(i18n.t('invoices.notes'), 14, finalY + 35)
      const noteLines = doc.splitTextToSize(invoice.notes, 170)
      doc.text(noteLines, 14, finalY + 40)
    }

    doc.save(`${invoice.number}.pdf`)
  }, [invoice])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-2xl border border-border/30 shadow-modal w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border/10 z-10 flex items-center justify-between p-4">
            <h3 className="text-sm font-bold">{i18n.t('invoices.preview')} — {invoice.number}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrint} title={i18n.t('invoices.print')} className="h-8 w-8 rounded-lg">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownloadPdf} title={i18n.t('invoices.download_pdf')} className="h-8 w-8 rounded-lg">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-6 space-y-6" id="invoice-preview-content">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight">{i18n.t('invoices.invoice')}</h1>
                <p className="text-sm text-muted-foreground">{invoice.number}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{i18n.t('invoices.date')}: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p>{i18n.t('invoices.due_date')}: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t border-border/20 pt-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{i18n.t('invoices.bill_to')}</h3>
              <p className="text-sm font-semibold">{invoice.clientName}</p>
              <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
              {invoice.clientAddress && <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">#</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">{i18n.t('invoices.item')}</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground text-xs">{i18n.t('invoices.qty')}</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground text-xs">{i18n.t('invoices.unit_price')}</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground text-xs">{i18n.t('invoices.total')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-border/10">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{i18n.t('invoices.subtotal')}</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{i18n.t('invoices.tax')} ({invoice.taxRate}%)</span>
                  <span>${invoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/20 pt-1 text-base font-bold">
                  <span>{i18n.t('invoices.total')}</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="border-t border-border/20 pt-4">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{i18n.t('invoices.notes')}</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
