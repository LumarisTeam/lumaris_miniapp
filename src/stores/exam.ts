import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getExams } from '@/api/modules/exam'
import type { ExamItem } from '@/types'
import { isUpcomingExam } from '@/utils/education'

export const useExamStore = defineStore('exam', () => {
  const exams = ref<ExamItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const upcomingExams = computed(() => exams.value.filter((exam) => isUpcomingExam(exam)))

  async function fetchExams(studentId: string, options: { silent?: boolean } = {}) {
    if (!studentId) {
      exams.value = []
      error.value = ''
      loaded.value = true
      return
    }

    if (!options.silent) {
      loading.value = true
    }
    error.value = ''

    try {
      const res = await getExams(studentId)
      exams.value = res.data ?? []
      loaded.value = true
    } catch (err) {
      const message = err instanceof Error ? err.message : '考试数据加载失败'
      error.value = message
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function clear() {
    exams.value = []
    loading.value = false
    loaded.value = false
    error.value = ''
  }

  return {
    exams,
    loading,
    loaded,
    error,
    upcomingExams,
    fetchExams,
    clear,
  }
})
