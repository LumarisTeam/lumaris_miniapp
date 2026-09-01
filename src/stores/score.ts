import { create } from 'zustand'
import type { FetchPolicy, ScoreList } from '@/types/domain'
import { getScoreSnapshot, readScoreLists } from '@/services/scoreRepository'
import { useAppStore } from '@/stores/app'

interface ScoreState {
  scoreLists: ScoreList[]
  loading: boolean
  refreshing: boolean
  isFromLocal: boolean
  isStale: boolean
  error: string
  load: (studentId: string, policy?: FetchPolicy) => Promise<void>
  clear: () => void
}

export const useScoreStore = create<ScoreState>((set) => ({
  scoreLists: [],
  loading: false,
  refreshing: false,
  isFromLocal: true,
  isStale: false,
  error: '',
  load: async (studentId, policy = 'local-first') => {
    const schoolCode = useAppStore.getState().school.code
    const requestedScope = `${schoolCode.toUpperCase()}:${studentId}`
    const local = readScoreLists(studentId, schoolCode)
    const hasLocal = local.length > 0
    set({ loading: !hasLocal, refreshing: hasLocal, error: '' })
    try {
      const snapshot = await getScoreSnapshot(studentId, schoolCode, policy)
      if (`${useAppStore.getState().school.code.toUpperCase()}:${studentId}` !== requestedScope) return
      set({ scoreLists: snapshot.data, isFromLocal: snapshot.isFromLocal, isStale: snapshot.isStale })
      if (policy === 'local-first' && snapshot.isFromLocal) {
        const refreshed = await getScoreSnapshot(studentId, schoolCode, 'refresh')
        if (`${useAppStore.getState().school.code.toUpperCase()}:${studentId}` !== requestedScope) return
        set({ scoreLists: refreshed.data, isFromLocal: refreshed.isFromLocal, isStale: refreshed.isStale })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '成绩加载失败' })
    } finally {
      set({ loading: false, refreshing: false })
    }
  },
  clear: () => set({ scoreLists: [], loading: false, refreshing: false, isFromLocal: false, isStale: false, error: '' }),
}))

useAppStore.subscribe((state, previous) => {
  if (state.school.code !== previous.school.code) useScoreStore.getState().clear()
})
