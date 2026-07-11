import { create } from 'zustand'
import type { Notification } from '@/lib/types'
import { db } from '@/lib/db'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: (userId: string) => void
  refreshNotifications: (userId: string) => void
  markRead: (id: string) => void
  markAllRead: (userId: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: (userId: string) => {
    set({ isLoading: true })
    try {
      const notifications = db.getNotifications(userId)
      const unreadCount = notifications.filter(n => !n.read).length
      set({ notifications, unreadCount, isLoading: false })
    } catch (e) {
      console.error('fetchNotifications failed', e)
      set({ isLoading: false })
    }
  },

  refreshNotifications: (userId: string) => {
    db.checkDeadlinesAndOverdue(userId)
    db.checkWeeklyDigests(userId)
    set({ isLoading: true })
    try {
      const notifications = db.getNotifications(userId)
      const unreadCount = notifications.filter(n => !n.read).length
      set({ notifications, unreadCount, isLoading: false })
    } catch (e) {
      console.error('refreshNotifications failed', e)
      set({ isLoading: false })
    }
  },

  markRead: (id: string) => {
    db.markNotificationRead(id)
    set(state => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      return { notifications, unreadCount: notifications.filter(n => !n.read).length }
    })
  },

  markAllRead: (userId: string) => {
    db.markAllNotificationsRead(userId)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },
}))
