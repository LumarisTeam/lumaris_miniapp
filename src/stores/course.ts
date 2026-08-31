import { create } from 'zustand'
import { fetchCourses, fetchTimeInfo } from '@/api/education'
import type { Course, TimeInfo } from '@/types/domain'
import { assignCourseColors, calculateCurrentWeek } from '@/utils/education'
import { initializeStorage, readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'

initializeStorage()

function readCourseArray(key: typeof STORAGE_KEYS.COURSES | typeof STORAGE_KEYS.CUSTOM_COURSES): Course[] {
  const value = readStorage<unknown>(key, [])
  return Array.isArray(value) ? (value as Course[]) : []
}

interface CourseState {
  courses: Course[]
  customCourses: Course[]
  ignoredCourseNames: string[]
  timeInfo: TimeInfo | null
  currentWeek: number
  loading: boolean
  error: string
  refresh: (studentId: string) => Promise<void>
  setCurrentWeek: (week: number) => void
  toggleIgnored: (name: string) => void
  saveCustomCourse: (course: Course) => void
  removeCustomCourse: (id: string) => void
}

const initialTimeInfo = readStorage<TimeInfo | null>(STORAGE_KEYS.TIME_INFO, null)

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: assignCourseColors(readCourseArray(STORAGE_KEYS.COURSES)),
  customCourses: readCourseArray(STORAGE_KEYS.CUSTOM_COURSES),
  ignoredCourseNames: readStorage<string[]>(STORAGE_KEYS.IGNORED_COURSES, []),
  timeInfo: initialTimeInfo,
  currentWeek: calculateCurrentWeek(initialTimeInfo),
  loading: false,
  error: '',
  refresh: async (studentId) => {
    set({ loading: true, error: '' })
    const [coursesResult, timeResult] = await Promise.allSettled([
      fetchCourses(studentId),
      fetchTimeInfo(),
    ])

    const patch: Partial<CourseState> = { loading: false }
    if (coursesResult.status === 'fulfilled') {
      const courses = assignCourseColors(coursesResult.value)
      writeStorage(STORAGE_KEYS.COURSES, courses)
      patch.courses = courses
    }
    if (timeResult.status === 'fulfilled') {
      writeStorage(STORAGE_KEYS.TIME_INFO, timeResult.value)
      patch.timeInfo = timeResult.value
      patch.currentWeek = calculateCurrentWeek(timeResult.value)
    }
    if (coursesResult.status === 'rejected' && timeResult.status === 'rejected') {
      patch.error = coursesResult.reason instanceof Error ? coursesResult.reason.message : '课表刷新失败，已显示缓存'
    }
    set(patch)
  },
  setCurrentWeek: (week) => set({ currentWeek: Math.min(30, Math.max(1, week)) }),
  toggleIgnored: (name) => {
    const current = get().ignoredCourseNames
    const ignoredCourseNames = current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]
    writeStorage(STORAGE_KEYS.IGNORED_COURSES, ignoredCourseNames)
    set({ ignoredCourseNames })
  },
  saveCustomCourse: (course) => {
    const current = get().customCourses
    const customCourses = current.some((item) => item.id === course.id)
      ? current.map((item) => (item.id === course.id ? { ...course, isCustom: true } : item))
      : [...current, { ...course, isCustom: true }]
    writeStorage(STORAGE_KEYS.CUSTOM_COURSES, customCourses)
    set({ customCourses })
  },
  removeCustomCourse: (id) => {
    const customCourses = get().customCourses.filter((course) => course.id !== id)
    writeStorage(STORAGE_KEYS.CUSTOM_COURSES, customCourses)
    set({ customCourses })
  },
}))

export function selectVisibleCourses(state: CourseState): Course[] {
  const ignored = new Set(state.ignoredCourseNames)
  return [...state.courses.filter((course) => !ignored.has(course.name)), ...state.customCourses]
}
