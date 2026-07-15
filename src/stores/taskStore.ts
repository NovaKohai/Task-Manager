import { create } from 'zustand'
import type { Task, TaskStatus } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI, hasPermission } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
  search?: string
  sortBy?: 'updatedAt' | 'createdAt' | 'priority' | 'dueDate'
  offset?: number
  limit?: number
}

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  subtasks: Task[]
  filters: TaskFilters
  isLoading: boolean
  fetchTasks: () => Promise<void>
  fetchTask: (id: string) => Promise<void>
  createTask: (data: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<void>
  setFilters: (filters: TaskFilters) => void
  fetchSubtasks: (parentId: string) => Promise<void>
  createSubtask: (data: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  toggleSubtask: (id: string) => Promise<void>
  deleteSubtask: (id: string) => Promise<void>
  reorderTasks: (status: TaskStatus, taskIds: string[]) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  subtasks: [],
  filters: {},
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ tasks: db.getTasks(get().filters) })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('fetchTasks failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ currentTask: db.getTask(id) })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('fetchTask failed', msg)
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('createTask failed', msg)
      throw e instanceof Error ? e : new Error(msg)
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('updateTask failed', msg)
      throw e instanceof Error ? e : new Error(msg)
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('deleteTask failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  reorderTasks: async (status, taskIds) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const updatedTasks = db.reorderTasks(status, taskIds)
      set({ tasks: updatedTasks })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('reorderTasks failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchTasks()
  },

  fetchSubtasks: async (parentId: string) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      set({ subtasks: db.getSubtasks(parentId) })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('fetchSubtasks failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  createSubtask: async (data) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const subtask = db.createTask({ ...data, status: data.status || 'todo' })
      set(state => ({ subtasks: [...state.subtasks, subtask] }))
      return subtask
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('createSubtask failed', msg)
      throw e instanceof Error ? e : new Error(msg)
    } finally {
      set({ isLoading: false })
    }
  },

  toggleSubtask: async (id: string) => {
    const user = useAuthStore.getState().user
    if (!user || !hasPermission(user, 'subtask.toggle')) return
    set({ isLoading: true })
    try {
      await yieldToUI()
      const subtask = db.getTask(id)
      if (!subtask) return
      const newStatus = subtask.status === 'done' ? 'todo' : 'done'
      const updated = db.updateTask(id, { status: newStatus })
      set(state => ({
        subtasks: state.subtasks.map(t => t.id === id ? (updated ?? t) : t),
        currentTask: state.currentTask?.id === id ? updated : state.currentTask,
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('toggleSubtask failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  deleteSubtask: async (id: string) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      db.deleteTask(id)
      set(state => ({ subtasks: state.subtasks.filter(t => t.id !== id) }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('deleteSubtask failed', msg)
    } finally {
      set({ isLoading: false })
    }
  },
}))
