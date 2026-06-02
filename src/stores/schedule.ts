import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, TimeInfo } from '@/types'
import { getInfoTime } from '@/api/modules/info'

interface WeekRange {
  start: Date
  end: Date
  label: string
}

export const useScheduleStore = defineStore('schedule', () => {
  const currentWeek = ref(1)
  const totalWeeks = ref(20)
  const weekStartDate = ref<Date>(new Date())
  const semesterStartDate = ref<Date | null>(null)
  const timeInfo = ref<TimeInfo | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const weekLabel = computed(() => `第 ${currentWeek.value} 周`)
  const semesterLabel = computed(() => timeInfo.value?.semester ?? '')

  const weekRanges = computed<WeekRange[]>(() => {
    return Array.from({ length: totalWeeks.value }, (_, i) => {
      const start = getWeekStartFor(i + 1)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return {
        start,
        end,
        label: `第 ${i + 1} 周`,
      }
    })
  })

  function getWeekStartFor(week: number) {
    const baseDate = semesterStartDate.value ? new Date(semesterStartDate.value) : new Date(weekStartDate.value)
    baseDate.setDate(baseDate.getDate() + (week - 1) * 7)
    return baseDate
  }

  function parseDate(value: string): Date | null {
    if (!value) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  function calculateCurrentWeek(now = new Date()): number {
    if (!semesterStartDate.value) return currentWeek.value
    const diffDays = Math.floor((now.getTime() - semesterStartDate.value.getTime()) / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1
    return Math.min(totalWeeks.value, Math.max(1, week))
  }

  function syncCurrentWeek(now = new Date()) {
    const week = timeInfo.value?.currentWeek && timeInfo.value.currentWeek > 0
      ? timeInfo.value.currentWeek
      : calculateCurrentWeek(now)
    setCurrentWeek(week)
  }

  function setTimeInfo(info: TimeInfo) {
    timeInfo.value = info
    const startDate = parseDate(info.startTime)
    if (startDate) {
      semesterStartDate.value = startDate
      weekStartDate.value = startDate
    }
    syncCurrentWeek()
    loaded.value = true
  }

  async function fetchTimeInfo(force = false) {
    if (loaded.value && !force && timeInfo.value) {
      return timeInfo.value
    }

    loading.value = true
    error.value = ''
    try {
      const response = await getInfoTime()
      setTimeInfo(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '学期时间加载失败'
      loaded.value = true
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentWeek(week: number) {
    if (week >= 1 && week <= totalWeeks.value) {
      currentWeek.value = week
      weekStartDate.value = getWeekStartFor(week)
    }
  }

  function nextWeek() {
    if (currentWeek.value < totalWeeks.value) {
      setCurrentWeek(currentWeek.value + 1)
    }
  }

  function prevWeek() {
    if (currentWeek.value > 1) {
      setCurrentWeek(currentWeek.value - 1)
    }
  }

  function getCoursesForDay(courses: Course[], dayOfWeek: number, week: number): Course[] {
    return courses
      .filter((c) => c.dayOfWeek === dayOfWeek && c.weeks.includes(week))
      .sort((a, b) => a.startSlot - b.startSlot)
  }

  function getCoursesForWeek(courses: Course[], week: number): Record<number, Course[]> {
    const result: Record<number, Course[]> = {}
    for (let day = 1; day <= 7; day++) {
      result[day] = getCoursesForDay(courses, day, week)
    }
    return result
  }

  return {
    currentWeek,
    totalWeeks,
    weekStartDate,
    semesterStartDate,
    timeInfo,
    loading,
    loaded,
    error,
    weekLabel,
    semesterLabel,
    weekRanges,
    fetchTimeInfo,
    syncCurrentWeek,
    setCurrentWeek,
    nextWeek,
    prevWeek,
    getCoursesForDay,
    getCoursesForWeek,
  }
})
