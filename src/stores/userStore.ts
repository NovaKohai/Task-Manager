import { create } from 'zustand'
import type { User } from '@/lib/types'
import { db } from '@/lib/db'

interface UserState {
  users: User[]
  isLoading: boolean
  fetchUsers: () => Promise<void>
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'approved'> & { approved?: boolean }) => Promise<User>
  updateUser: (id: string, data: Partial<User>) => Promise<User | null>
  deleteUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const users = db.getUsers()
    set({ users, isLoading: false })
  },

  createUser: async (data) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const user = await db.createUser(data)
    set(state => ({ users: [...state.users, user], isLoading: false }))
    return user
  },

  updateUser: async (id, data) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const updated = db.updateUser(id, data)
    set(state => ({
      users: state.users.map(u => u.id === id ? (updated ?? u) : u),
      isLoading: false,
    }))
    return updated
  },

  deleteUser: async (id) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    db.deleteUser(id)
    set(state => ({
      users: state.users.filter(u => u.id !== id),
      isLoading: false,
    }))
  },
}))
