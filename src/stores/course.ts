import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course } from '@/types'
import { getStorage, setStorage, STORAGE_KEYS } from '@/utils/storage'
import { getCourses } from '@/api/modules/course'

const COURSE_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#5856D6', '#AF52DE', '#FF2D55', '#5AC8FA',
  '#FFCC00', '#0A84FF', '#30D158', '#FF9F0A',
  '#FF453A', '#5E5CE6', '#BF5AF2', '#FF375F',
  '#64D2FF', '#FFD60A',
]

function assignColors(courses: Course[]): Course[] {
  const colorMap = new Map<string, string>()
  let colorIndex = 0
  return courses.map((c) => {
    if (!colorMap.has(c.name)) {
      colorMap.set(c.name, COURSE_COLORS[colorIndex % COURSE_COLORS.length])
      colorIndex++
    }
    return { ...c, color: colorMap.get(c.name) }
  })
}

export const useCourseStore = defineStore('course', () => {
  const courses = ref<Course[]>([])
  const ignoredCourses = ref<string[]>(getStorage<string[]>(STORAGE_KEYS.IGNORED_COURSES) ?? [])
  const customCourses = ref<Course[]>(getStorage<Course[]>(STORAGE_KEYS.CUSTOM_COURSES) ?? [])
  const loading = ref(false)

  const visibleCourses = computed(() =>
    courses.value.filter((c) => !ignoredCourses.value.includes(c.name)),
  )

  const todayCourses = computed(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    return visibleCourses.value.filter((c) => c.dayOfWeek === dayOfWeek)
  })

  async function fetchCourses(studentId: string) {
    loading.value = true
    try {
      const res = await getCourses(studentId)
      if (res.data?.courses) {
        courses.value = assignColors(res.data.courses)
        setStorage(STORAGE_KEYS.COURSE_DATA, assignColors(res.data.courses))
      }
    } finally {
      loading.value = false
    }
  }

  function loadGuestCourses() {
    const data = getStorage<Course[]>(STORAGE_KEYS.GUEST_COURSE_DATA)
    if (data) {
      courses.value = assignColors(data)
    }
    const custom = getStorage<Course[]>(STORAGE_KEYS.CUSTOM_COURSES)
    if (custom) {
      customCourses.value = custom
    }
  }

  function addCustomCourse(course: Course) {
    const c = { ...course, isCustom: true }
    customCourses.value.push(c)
    setStorage(STORAGE_KEYS.CUSTOM_COURSES, customCourses.value)
  }

  function removeCustomCourse(name: string) {
    customCourses.value = customCourses.value.filter((c) => c.name !== name)
    setStorage(STORAGE_KEYS.CUSTOM_COURSES, customCourses.value)
  }

  function toggleIgnoreCourse(name: string) {
    const idx = ignoredCourses.value.indexOf(name)
    if (idx >= 0) {
      ignoredCourses.value.splice(idx, 1)
    } else {
      ignoredCourses.value.push(name)
    }
    setStorage(STORAGE_KEYS.IGNORED_COURSES, ignoredCourses.value)
  }

  function clearAll() {
    courses.value = []
    customCourses.value = []
    ignoredCourses.value = []
  }

  return {
    courses,
    customCourses,
    ignoredCourses,
    visibleCourses,
    todayCourses,
    loading,
    fetchCourses,
    loadGuestCourses,
    addCustomCourse,
    removeCustomCourse,
    toggleIgnoreCourse,
    clearAll,
  }
})
