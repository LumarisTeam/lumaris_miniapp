import { create } from 'zustand'
import { login as loginRequest } from '@/api/education'
import { setUnauthorizedHandler } from '@/api/client'
import type { AuthSession, School } from '@/types/domain'
import { initializeStorage, readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import { useCourseStore } from '@/stores/course'
import { useScoreStore } from '@/stores/score'
import { createAuthSession } from '@/utils/auth'

initializeStorage()

interface AuthState {
  session: AuthSession | null
  loading: boolean
  error: string
  login: (username: string, password: string, school: School) => Promise<boolean>
  logout: (reason?: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null),
  loading: false,
  error: '',
  login: async (username, password, school) => {
    useCourseStore.getState().clearRemote()
    useScoreStore.getState().clear()
    set({ loading: true, error: '' })
    try {
      const result = await loginRequest(username.trim(), password)
      const session = createAuthSession(username, result, school)
      if (!session) {
        set({ error: '账号或密码错误' })
        return false
      }
      writeStorage(STORAGE_KEYS.SESSION, session)
      set({ session })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '登录失败，请稍后重试' })
      return false
    } finally {
      set({ loading: false })
    }
  },
  logout: (reason = '') => {
    removeStorage(STORAGE_KEYS.SESSION)
    useCourseStore.getState().clearRemote()
    useScoreStore.getState().clear()
    set({ session: null, error: reason })
  },
}))

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout('登录已过期，请重新登录')
})
