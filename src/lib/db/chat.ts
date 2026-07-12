import type { ChatRequest, ChatMessage } from '../types'

export function getChatRequests(data: any, userId: string): ChatRequest[] {
  return (data.chatRequests || []).filter((r: any) => r.senderId === userId || r.receiverId === userId)
}

export function sendChatRequest(
  data: any,
  persist: () => void,
  generateId: () => string,
  senderId: string,
  receiverId: string
): ChatRequest {
  if (!data.chatRequests) data.chatRequests = []
  const exists = data.chatRequests.find((r: any) => 
    (r.senderId === senderId && r.receiverId === receiverId && r.status !== 'rejected') ||
    (r.senderId === receiverId && r.receiverId === senderId && r.status !== 'rejected')
  )
  if (exists) return exists

  const req: ChatRequest = {
    id: generateId(),
    senderId,
    receiverId,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  data.chatRequests.push(req)
  persist()
  window.dispatchEvent(new CustomEvent('ttm_realtime_update'))
  return req
}

export function respondToChatRequest(
  data: any,
  persist: () => void,
  requestId: string,
  status: 'accepted' | 'rejected'
): ChatRequest | null {
  if (!data.chatRequests) return null
  const idx = data.chatRequests.findIndex((r: any) => r.id === requestId)
  if (idx === -1) return null
  const req = data.chatRequests[idx]
  req.status = status
  persist()
  window.dispatchEvent(new CustomEvent('ttm_realtime_update'))
  return req
}

export function getChatMessages(data: any, userA: string, userB: string): ChatMessage[] {
  return (data.chatMessages || []).filter((m: any) => 
    (m.senderId === userA && m.receiverId === userB) ||
    (m.senderId === userB && m.receiverId === userA)
  )
}

export function sendChatMessage(
  data: any,
  persist: () => void,
  generateId: () => string,
  senderId: string,
  receiverId: string,
  text: string
): ChatMessage {
  if (!data.chatMessages) data.chatMessages = []
  const msg: ChatMessage = {
    id: generateId(),
    senderId,
    receiverId,
    text,
    createdAt: new Date().toISOString()
  }
  data.chatMessages.push(msg)
  persist()
  window.dispatchEvent(new CustomEvent('ttm_realtime_update'))
  return msg
}
