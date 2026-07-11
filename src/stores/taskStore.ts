import { create } from 'zustand'
import type { Task } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
  search?: string
}

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  filters: TaskFilters
  isLoading: boolean
  fetchTasks: () => Promise<void>
  fetchTask: (id: string) => Promise<void>
  createTask: (data: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<void>
  setFilters: (filters: TaskFilters) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  filters: {},
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ tasks: db.getTasks(get().filters) })
    } catch (e) {
      console.error('fetchTasks failed', e)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ currentTask: db.getTask(id) })
    } catch (e) {
      console.error('fetchTask failed', e)
    } finally {
      set({ isLoading: false })
    }
  },

  createTask: async (data) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const task = db.createTask(data)
      set(state => ({ tasks: [task, ...state.tasks] }))
      return task
    } catch (e) {
      console.error('createTask failed', e)
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  updateTask: async (id, data) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const updated = db.updateTask(id, data)
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? (updated ?? t) : t),
        currentTask: state.currentTask?.id === id ? updated : state.currentTask,
      }))
      return updated
    } catch (e) {
      console.error('updateTask failed', e)
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      db.deleteTask(id)
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
      }))
    } catch (e) {
      console.error('deleteTask failed', e)
    } finally {
      set({ isLoading: false })
    }
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchTasks()
  },
}))
