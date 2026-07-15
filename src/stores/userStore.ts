import { create } from 'zustand'
import type { Permission, User } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface UserState {
  users: User[]
  isLoading: boolean
  fetchUsers: () => Promise<void>
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'approved' | 'permissions'> & { approved?: boolean; permissions?: Permission[] }, password?: string) => Promise<User>
  updateUser: (id: string, data: Partial<User>) => Promise<User | null>
  updateUserPassword: (username: string, newPassword: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ users: db.getUsers() })
    } catch (e: unknown) {
      console.error('fetchUsers failed', e instanceof Error ? e.message : String(e))
    } finally {
      set({ isLoading: false })
    }
  },

  createUser: async (data, password) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const user = await db.createUser(data, password)
      set(state => ({ users: [...state.users, user] }))
      return user
    } catch (e: unknown) {
      console.error('createUser failed', e instanceof Error ? e.message : String(e))
      throw e instanceof Error ? e : new Error(String(e))
    } finally {
      set({ isLoading: false })
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const updated = db.updateUser(id, data)
      set(state => ({
        users: state.users.map(u => u.id === id ? (updated ?? u) : u),
      }))
      return updated
    } catch (e: unknown) {
      console.error('updateUser failed', e instanceof Error ? e.message : String(e))
      throw e instanceof Error ? e : new Error(String(e))
    } finally {
      set({ isLoading: false })
    }
  },

  updateUserPassword: async (username: string, newPassword: string) => {
    try {
      await db.updatePassword(username, newPassword)
    } catch (e: unknown) {
      console.error('updateUserPassword failed', e instanceof Error ? e.message : String(e))
      throw e instanceof Error ? e : new Error(String(e))
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      db.deleteUser(id)
      set(state => ({ users: state.users.filter(u => u.id !== id) }))
    } catch (e: unknown) {
      console.error('deleteUser failed', e instanceof Error ? e.message : String(e))
    } finally {
      set({ isLoading: false })
    }
  },
}))
