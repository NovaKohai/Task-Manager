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

let simulatorStarted = false

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

      if (!simulatorStarted) {
        simulatorStarted = true
        setInterval(() => {
          try {
            const users = db.getUsers()
            const tasksList = db.getTasks()
            const activeTasks = tasksList.filter(t => t.status !== 'done' && t.status !== 'cancelled')
            if (activeTasks.length > 0 && users.length > 1) {
              const randTask = activeTasks[Math.floor(Math.random() * activeTasks.length)]
              const otherUsers = users.filter(u => u.id !== randTask.assigneeId)
              const randUser = otherUsers.length > 0 ? otherUsers[Math.floor(Math.random() * otherUsers.length)] : users[0]

              const commentMsg = `[Simulated Update] Checked progress on this task. Everything looks on track!`
              db.addComment({
                taskId: randTask.id,
                authorId: randUser.id,
                content: commentMsg,
                editedAt: null,
                deleted: false
              })

              if (randTask.assigneeId) {
                db.addNotification({
                  userId: randTask.assigneeId,
                  type: 'comment',
                  title: `New activity on ${randTask.code}`,
                  message: `${randUser.name} commented: ${commentMsg}`,
                  taskId: randTask.id,
                  read: false
                })
              }

              set({ tasks: db.getTasks(get().filters) })
              window.dispatchEvent(new CustomEvent('ttm_realtime_update'))
            }
          } catch (err) {
            console.error('Simulated update error', err)
          }
        }, 30000)
      }
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

  reorderTasks: async (status, taskIds) => {
    set({ isLoading: true })
    try {
      await yieldToUI()
      const updatedTasks = db.reorderTasks(status, taskIds)
      set({ tasks: updatedTasks })
    } catch (e) {
      console.error('reorderTasks failed', e)
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
    } catch (e) {
      console.error('fetchSubtasks failed', e)
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
    } catch (e) {
      console.error('createSubtask failed', e)
      throw e
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
    } catch (e) {
      console.error('toggleSubtask failed', e)
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
    } catch (e) {
      console.error('deleteSubtask failed', e)
    } finally {
      set({ isLoading: false })
    }
  },
}))
