import { create } from 'zustand'
import type { Comment } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface CommentState {
  comments: Comment[]
  isLoading: boolean
  fetchComments: (taskId: string) => Promise<void>
  addComment: (taskId: string, authorId: string, content: string) => Promise<Comment>
  editComment: (id: string, content: string) => Promise<Comment | null>
  deleteComment: (id: string) => Promise<void>
}

export const useCommentStore = create<CommentState>((set) => ({
  comments: [],
  isLoading: false,

  fetchComments: async (taskId: string) => {
    set({ isLoading: true })
    await yieldToUI()
    const comments = db.getComments(taskId)
    set({ comments, isLoading: false })
  },

  addComment: async (taskId, authorId, content) => {
    set({ isLoading: true })
    await yieldToUI()
    const comment = db.addComment({ taskId, authorId, content, editedAt: null, deleted: false })
    set(state => ({ comments: [...state.comments, comment], isLoading: false }))
    return comment
  },

  editComment: async (id, content) => {
    set({ isLoading: true })
    await yieldToUI()
    const updated = db.updateComment(id, content)
    set(state => ({
      comments: state.comments.map(c => c.id === id ? (updated ?? c) : c),
      isLoading: false,
    }))
    return updated
  },

  deleteComment: async (id) => {
    set({ isLoading: true })
    await yieldToUI()
    db.softDeleteComment(id)
    set(state => ({
      comments: state.comments.filter(c => c.id !== id),
      isLoading: false,
    }))
  },
}))
