import { create } from 'zustand'
import type { Notification } from '@/lib/types'
import { db } from '@/lib/db'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: (userId: string) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const notifications = db.getNotifications(userId)
    const unreadCount = notifications.filter(n => !n.read).length
    set({ notifications, unreadCount, isLoading: false })
  },

  markRead: async (id: string) => {
    await new Promise(r => setTimeout(r, 0))
    db.markNotificationRead(id)
    set(state => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      return { notifications, unreadCount: notifications.filter(n => !n.read).length }
    })
  },

  markAllRead: async (userId: string) => {
    await new Promise(r => setTimeout(r, 0))
    db.markAllNotificationsRead(userId)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },
}))
