import type { SupportTicket, SupportTicketComment } from '../types'
import { i18n } from '../i18n'

export function getSupportTickets(data: any): SupportTicket[] {
  return data.supportTickets || []
}

export function deleteSupportTicket(
  data: any,
  persist: () => void,
  id: string
): boolean {
  if (!data.supportTickets) return false
  const idx = data.supportTickets.findIndex((t: any) => t.id === id)
  if (idx === -1) return false
  data.supportTickets.splice(idx, 1)
  persist()
  return true
}

export function addCommentToSupportTicket(
  data: any,
  persist: () => void,
  generateId: () => string,
  ticketId: string,
  authorId: string,
  text: string
): SupportTicketComment | null {
  if (!data.supportTickets) return null
  const ticket = data.supportTickets.find((t: any) => t.id === ticketId)
  if (!ticket) return null
  if (!ticket.comments) ticket.comments = []
  const comment: SupportTicketComment = {
    id: generateId(),
    authorId,
    text,
    createdAt: new Date().toISOString(),
  }
  ticket.comments.push(comment)
  persist()
  return comment
}

export function createSupportTicket(
  data: any,
  persist: () => void,
  generateId: () => string,
  addNotification: (n: any) => void,
  t: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assigneeId'>
): SupportTicket {
  const ticket: SupportTicket = {
    ...t,
    id: generateId(),
    status: 'pending',
    assigneeId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (!data.supportTickets) {
    data.supportTickets = []
  }
  data.supportTickets.push(ticket)
  persist()

  const itUsers = data.users.filter((u: any) => u.department === 'it' && u.id !== t.creatorId)
  const creatorUser = data.users.find((u: any) => u.id === t.creatorId)
  const creatorName = creatorUser ? creatorUser.name : i18n.t('support.employee')
  const categoryLabel = i18n.t(`support.ticket.category.${t.category}`)
  
  itUsers.forEach((it: any) => {
    addNotification({
      userId: it.id,
      type: 'support_ticket',
      title: i18n.t('support.notif.new_ticket.title'),
      message: i18n.t('support.notif.new_ticket.msg')
        .replace('{name}', creatorName)
        .replace('{category}', categoryLabel),
      read: false
    })
  })

  return ticket
}

export function updateSupportTicket(
  data: any,
  persist: () => void,
  addNotification: (n: any) => void,
  id: string,
  updates: Partial<SupportTicket>
): SupportTicket | null {
  if (!data.supportTickets) return null
  const idx = data.supportTickets.findIndex((t: any) => t.id === id)
  if (idx === -1) return null
  const old = data.supportTickets[idx]
  const updated = {
    ...old,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  data.supportTickets[idx] = updated
  persist()

  if (updates.status && updates.status !== old.status) {
    const creatorId = old.creatorId
    const statusLabel = i18n.t(`support.status.${updates.status}`)
    addNotification({
      userId: creatorId,
      type: 'support_status_update',
      title: i18n.t('support.notif.status_update.title'),
      message: i18n.t('support.notif.status_update.msg')
        .replace('{status}', statusLabel),
      read: false
    })
  }

  return updated
}
