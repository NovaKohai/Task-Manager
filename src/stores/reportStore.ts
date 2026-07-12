import { create } from 'zustand'
import type { ReportMetrics } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface ReportState {
  metrics: ReportMetrics | null
  effortByUser: Map<string, number>
  isLoading: boolean
  fetchMetrics: (period?: string) => Promise<void>
  fetchEffortByUser: (sinceISO: string) => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  metrics: null,
  effortByUser: new Map(),
  isLoading: false,

  fetchMetrics: async (period?: string) => {
    set({ isLoading: true })
    await yieldToUI()
    const metrics = db.getReportMetrics(period)
    set({ metrics, isLoading: false })
  },

  fetchEffortByUser: async (sinceISO: string) => {
    set({ isLoading: true })
    await yieldToUI()
    const effortByUser = db.totalMinutesByAssignee({ sinceISO })
    set({ effortByUser, isLoading: false })
  },
}))
