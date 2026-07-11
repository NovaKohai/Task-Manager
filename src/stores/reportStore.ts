import { create } from 'zustand'
import type { ReportMetrics } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

interface ReportState {
  metrics: ReportMetrics | null
  isLoading: boolean
  fetchMetrics: (period?: string) => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  metrics: null,
  isLoading: false,

  fetchMetrics: async (period?: string) => {
    set({ isLoading: true })
    await yieldToUI()
    const metrics = db.getReportMetrics(period)
    set({ metrics, isLoading: false })
  },
}))
