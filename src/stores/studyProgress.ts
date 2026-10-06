import { create } from 'zustand'
import type { FetchPolicy, StudyModule } from '@/types/domain'
import { getStudyProgressSnapshot } from '@/services/domainRepository'
import { useAppStore } from '@/stores/app'
import { t } from '@/i18n'

/**
 * 学业进度（学分）卡片的数据源。
 *
 * 对应 Flutter `InfoService.getInfoList` + 「我的」页里的 FutureBuilder：先出本地
 * 缓存再后台刷新，失败时保留已有数据。刷新编排（`refreshService`）也走这个 store，
 * 所以设置页点「刷新数据」后，我的页拿到的就是刚拉下来的那份。
 */

interface StudyProgressState {
  modules: StudyModule[]
  loading: boolean
  isFromLocal: boolean
  isStale: boolean
  error: string
  /** 已加载过的学号，用来在账号变化时丢弃旧数据。 */
  studentId: string
  load: (studentId: string, policy?: FetchPolicy) => Promise<void>
  clear: () => void
}

export const useStudyProgressStore = create<StudyProgressState>((set) => ({
  modules: [],
  loading: false,
  isFromLocal: true,
  isStale: false,
  error: '',
  studentId: '',
  load: async (studentId, policy = 'local-first') => {
    if (!studentId) return
    const schoolCode = useAppStore.getState().school.code
    const isCurrentStudent = () => useStudyProgressStore.getState().studentId === studentId

    set((state) => ({
      loading: state.modules.length === 0,
      studentId,
      error: '',
    }))

    try {
      const snapshot = await getStudyProgressSnapshot(studentId, schoolCode, policy)
      if (!isCurrentStudent()) return
      set({
        modules: snapshot.data,
        isFromLocal: snapshot.isFromLocal,
        isStale: snapshot.isStale,
      })

      if (policy === 'local-first' && snapshot.isFromLocal) {
        const refreshed = await getStudyProgressSnapshot(studentId, schoolCode, 'refresh')
        if (!isCurrentStudent()) return
        set({
          modules: refreshed.data,
          isFromLocal: refreshed.isFromLocal,
          isStale: refreshed.isStale,
        })
      }
    } catch (loadError) {
      if (!isCurrentStudent()) return
      set({
        error: loadError instanceof Error ? loadError.message : t('loadFailed'),
        isStale: true,
      })
    } finally {
      if (isCurrentStudent()) set({ loading: false })
    }
  },
  clear: () => set({ modules: [], loading: false, isFromLocal: false, isStale: false, error: '', studentId: '' }),
}))

useAppStore.subscribe((state, previous) => {
  if (state.school.code !== previous.school.code) useStudyProgressStore.getState().clear()
})
