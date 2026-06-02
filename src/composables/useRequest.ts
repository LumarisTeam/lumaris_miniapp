import type { Ref } from 'vue'
import { ref } from 'vue'

interface UseRequestReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: unknown[]) => Promise<void>
  reset: () => void
}

export function useRequest<T>(
  fn: (...args: unknown[]) => Promise<{ data: T }>,
): UseRequestReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(...args: unknown[]) {
    loading.value = true
    error.value = null
    try {
      const res = await fn(...args)
      data.value = (res as { data: T }).data ?? (res as T)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    loading.value = false
    error.value = null
  }

  return { data, loading, error, execute, reset }
}
