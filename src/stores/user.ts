import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserData } from '@/types'
import { getStorage, setStorage, removeStorage, STORAGE_KEYS, clearAll } from '@/utils/storage'
import { registerReLogin } from '@/api/client'
import { login as loginApi } from '@/api/modules/auth'

export const useUserStore = defineStore('user', () => {
  const userData = ref<UserData | null>(getStorage<UserData>(STORAGE_KEYS.USER_DATA))
  const isLogin = computed(() => userData.value !== null)
  const studentId = computed(() => userData.value?.studentId ?? '')
  const cookie = computed(() => userData.value?.cookie ?? '')
  const loading = ref(false)

  registerReLogin(async () => {
    const creds = getStorage<{ username: string; password: string }>(STORAGE_KEYS.CREDENTIALS)
    if (!creds) return false
    try {
      const res = await loginApi(creds.username, creds.password)
      if (res.data?.success) {
        setUserData({
          studentId: res.data.studentId,
          name: userData.value?.name ?? '',
          cookie: res.data.cookie,
          schoolCode: userData.value?.schoolCode ?? '',
        })
        return true
      }
      return false
    } catch {
      return false
    }
  })

  function setUserData(data: UserData) {
    userData.value = data
    setStorage(STORAGE_KEYS.USER_DATA, data)
  }

  async function loginAction(username: string, password: string): Promise<boolean> {
    loading.value = true
    try {
      const res = await loginApi(username, password)
      if (res.data?.success) {
        setStorage(STORAGE_KEYS.CREDENTIALS, { username, password })
        setUserData({
          studentId: res.data.studentId,
          name: username,
          cookie: res.data.cookie,
          schoolCode: '',
        })
        return true
      }
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    userData.value = null
    removeStorage(STORAGE_KEYS.USER_DATA)
    removeStorage(STORAGE_KEYS.CREDENTIALS)
  }

  return {
    userData,
    isLogin,
    studentId,
    cookie,
    loading,
    loginAction,
    logout,
    setUserData,
  }
})
