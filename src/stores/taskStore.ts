import { create } from 'zustand'
import type { Task } from '@/lib/types'
import { db } from '@/lib/db'

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
    await new Promise(r => setTimeout(r, 0))
    const tasks = db.getTasks(get().filters)
    set({ tasks, isLoading: false })
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const task = db.getTask(id)
    set({ currentTask: task, isLoading: false })
  },

  createTask: async (data) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const task = db.createTask(data)
    set(state => ({ tasks: [task, ...state.tasks], isLoading: false }))
    return task
  },

  updateTask: async (id, data) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const updated = db.updateTask(id, data)
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? (updated ?? t) : t),
      currentTask: state.currentTask?.id === id ? updated : state.currentTask,
      isLoading: false,
    }))
    return updated
  },

  deleteTask: async (id) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    db.deleteTask(id)
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
      isLoading: false,
    }))
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchTasks()
  },
}))
