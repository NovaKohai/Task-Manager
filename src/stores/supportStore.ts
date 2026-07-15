import { create } from 'zustand'
import type { SupportTicket, SupportTicketComment } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface SupportState {
  tickets: SupportTicket[]
  isLoading: boolean
  fetchTickets: () => Promise<void>
  createTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assigneeId'>) => Promise<SupportTicket>
  updateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<SupportTicket | null>
  deleteTicket: (id: string) => Promise<boolean>
  addComment: (ticketId: string, authorId: string, text: string) => Promise<SupportTicketComment | null>
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: [],
  isLoading: false,

  fetchTickets: async () => {
    set({ isLoading: true })
    await yieldToUI()
    const tickets = db.getSupportTickets()
    set({ tickets, isLoading: false })
  },

  createTicket: async (ticketData) => {
    set({ isLoading: true })
    await yieldToUI()
    const ticket = db.createSupportTicket(ticketData)
    set(state => ({ tickets: [...state.tickets, ticket], isLoading: false }))
    return ticket
  },

  updateTicket: async (id, updates) => {
    set({ isLoading: true })
    await yieldToUI()
    const updated = db.updateSupportTicket(id, updates)
    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? (updated ?? t) : t),
      isLoading: false,
    }))
    return updated
  },

  deleteTicket: async (id) => {
    const ok = db.deleteSupportTicket(id)
    if (ok) {
      set(state => ({ tickets: state.tickets.filter(t => t.id !== id) }))
    }
    return ok
  },

  addComment: async (ticketId, authorId, text) => {
    const comment = db.addCommentToSupportTicket(ticketId, authorId, text)
    if (comment) {
      set(state => ({
        tickets: state.tickets.map(t =>
          t.id === ticketId
            ? { ...t, comments: [...(t.comments || []), comment!] }
            : t
        )
      }))
    }
    return comment
  },
}))
