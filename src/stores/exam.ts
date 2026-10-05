import { create } from 'zustand'
import { getExamSnapshot } from '@/services/examRepository'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import type { Exam, FetchPolicy } from '@/types/domain'

/**
 * 近期考试。
 *
 * 对应 Flutter 的 `ExamService` + `ExamCard` 里的那段状态：首页展示、支持手动
 * 刷新，失败时保留已有数据并把错误暴露给界面。
 */

interface ExamState {
  exams: Exam[]
  isLoading: boolean
  error: string
  load: (policy?: FetchPolicy) => Promise<void>
  clear: () => void
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  isLoading: false,
  error: '',

  load: async (policy = 'local-first') => {
    const session = useAuthStore.getState().session
    if (!session) {
      set({ exams: [], isLoading: false, error: '' })
      return
    }

    const school = useAppStore.getState().school
    const scope = `${school.code.toUpperCase()}:${session.educationId}`
    set({ isLoading: get().exams.length === 0, error: '' })

    try {
      const snapshot = await getExamSnapshot(session.educationId, school.code, policy)
      // 取数期间换了学校/账号就丢弃结果。
      const current = useAuthStore.getState().session
      const currentSchool = useAppStore.getState().school
      if (!current || `${currentSchool.code.toUpperCase()}:${current.educationId}` !== scope) return

      set({ exams: snapshot.data, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },

  clear: () => set({ exams: [], isLoading: false, error: '' }),
}))

useAuthStore.subscribe((state, previous) => {
  if (state.session?.educationId !== previous.session?.educationId) useExamStore.getState().clear()
})
