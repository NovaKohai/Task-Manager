import { create } from 'zustand'
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuthStore } from './authStore'

interface InvoiceState {
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  statusFilter: InvoiceStatus | null
  searchQuery: string
  isLoading: boolean
  setSelectedInvoice: (inv: Invoice | null) => void
  setStatusFilter: (s: InvoiceStatus | null) => void
  setSearchQuery: (q: string) => void
  fetchInvoices: () => void
  createInvoice: (inv: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'paidAt' | 'createdBy'>) => Invoice
  updateInvoice: (id: string, updates: Partial<Omit<Invoice, 'id' | 'number' | 'createdAt'>>) => void
  deleteInvoice: (id: string) => void
  markPaid: (id: string) => void
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  statusFilter: null,
  searchQuery: '',
  isLoading: false,

  setSelectedInvoice: (inv) => set({ selectedInvoice: inv }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchInvoices: () => {
    const { statusFilter, searchQuery } = get()
    set({
      invoices: db.getInvoices({
        status: statusFilter ?? undefined,
        search: searchQuery || undefined,
      }),
    })
  },

  createInvoice: (inv) => {
    const user = useAuthStore.getState().user
    if (!user) return null as unknown as Invoice
    const created = db.createInvoice({ ...inv, createdBy: user.id })
    set((s) => ({ invoices: [created, ...s.invoices] }))
    return created
  },

  updateInvoice: (id, updates) => {
    db.updateInvoice(id, updates)
    get().fetchInvoices()
  },

  deleteInvoice: (id) => {
    db.deleteInvoice(id)
    if (get().selectedInvoice?.id === id) set({ selectedInvoice: null })
    get().fetchInvoices()
  },

  markPaid: (id) => {
    db.markInvoicePaid(id)
    get().fetchInvoices()
  },
}))
