import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course } from '@/types'

interface WeekRange {
  start: Date
  end: Date
  label: string
}

export const useScheduleStore = defineStore('schedule', () => {
  const currentWeek = ref(1)
  const totalWeeks = ref(20)
  const weekStartDate = ref<Date>(new Date())

  const weekLabel = computed(() => `第 ${currentWeek.value} 周`)

  const weekRanges = computed<WeekRange[]>(() => {
    return Array.from({ length: totalWeeks.value }, (_, i) => {
      const start = new Date(weekStartDate.value)
      start.setDate(start.getDate() + i * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return {
        start,
        end,
        label: `第 ${i + 1} 周`,
      }
    })
  })

  function setCurrentWeek(week: number) {
    if (week >= 1 && week <= totalWeeks.value) {
      currentWeek.value = week
    }
  }

  function nextWeek() {
    if (currentWeek.value < totalWeeks.value) {
      currentWeek.value++
    }
  }

  function prevWeek() {
    if (currentWeek.value > 1) {
      currentWeek.value--
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
    weekLabel,
    weekRanges,
    setCurrentWeek,
    nextWeek,
    prevWeek,
    getCoursesForDay,
    getCoursesForWeek,
  }
})
