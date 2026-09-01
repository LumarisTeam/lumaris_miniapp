import { create } from 'zustand'
import type { AuthSession, Course, FetchPolicy, TimeInfo } from '@/types/domain'
import { assignCourseColors, calculateWeekInfo, normalizeCourse } from '@/utils/education'
import { useAppStore } from '@/stores/app'
import { initializeStorage, readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import { getCourseBundle, readCourseBundle } from '@/services/courseRepository'

initializeStorage()

function readCourseArray(key: typeof STORAGE_KEYS.COURSES | typeof STORAGE_KEYS.CUSTOM_COURSES): Course[] {
  const value = readStorage<unknown>(key, [])
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map(normalizeCourse)
    : []
}

interface CourseState {
  courses: Course[]
  customCourses: Course[]
  ignoredCourseNames: string[]
  timeInfo: TimeInfo | null
  currentWeek: number
  weekNow: number
  maxWeek: number
  loading: boolean
  refreshing: boolean
  isFromLocal: boolean
  isStale: boolean
  error: string
  refresh: (studentId: string, policy?: FetchPolicy) => Promise<void>
  recalculateWeek: () => void
  clearRemote: () => void
  setCurrentWeek: (week: number) => void
  toggleIgnored: (name: string) => void
  saveCustomCourse: (course: Course) => void
  removeCustomCourse: (id: string) => void
}

const initialSession = readStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null)
const initialSchool = useAppStore.getState().school
const initialBundle = initialSession
  ? readCourseBundle(initialSession.educationId, initialSchool.code).data
  : { courses: [], timeInfo: null }
const initialTimeInfo = initialBundle.timeInfo
const initialWeekInfo = calculateWeekInfo(initialTimeInfo, new Date(), useAppStore.getState().school.weekStartDay)

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: initialBundle.courses,
  customCourses: assignCourseColors(readCourseArray(STORAGE_KEYS.CUSTOM_COURSES)),
  ignoredCourseNames: readStorage<string[]>(STORAGE_KEYS.IGNORED_COURSES, []),
  timeInfo: initialTimeInfo,
  currentWeek: initialWeekInfo.week,
  weekNow: initialWeekInfo.week,
  maxWeek: initialWeekInfo.maxWeek,
  loading: false,
  refreshing: false,
  isFromLocal: true,
  isStale: false,
  error: '',
  refresh: async (studentId, policy = 'refresh') => {
    const hasLocal = get().courses.length > 0
    set({ loading: !hasLocal, refreshing: hasLocal, error: '' })
    const school = useAppStore.getState().school
    const requestedScope = `${school.code.toUpperCase()}:${studentId}`
    try {
      const snapshot = await getCourseBundle(studentId, school.code, policy)
      if (`${useAppStore.getState().school.code.toUpperCase()}:${studentId}` !== requestedScope) return
      const weekInfo = calculateWeekInfo(snapshot.data.timeInfo, new Date(), school.weekStartDay)
      if (snapshot.coursesRefreshed) {
        writeStorage(STORAGE_KEYS.IGNORED_COURSES, [])
      }
      set({
        courses: snapshot.data.courses,
        timeInfo: snapshot.data.timeInfo,
        currentWeek: weekInfo.week <= 0 ? 0 : weekInfo.week,
        weekNow: weekInfo.week,
        maxWeek: weekInfo.maxWeek,
        isFromLocal: snapshot.isFromLocal,
        isStale: snapshot.isStale,
        ...(snapshot.coursesRefreshed ? { ignoredCourseNames: [] } : {}),
      })
      if (policy === 'local-first' && snapshot.isFromLocal) {
        const refreshed = await getCourseBundle(studentId, school.code, 'refresh')
        if (`${useAppStore.getState().school.code.toUpperCase()}:${studentId}` !== requestedScope) return
        const refreshedWeek = calculateWeekInfo(refreshed.data.timeInfo, new Date(), school.weekStartDay)
        if (refreshed.coursesRefreshed) writeStorage(STORAGE_KEYS.IGNORED_COURSES, [])
        set({ courses: refreshed.data.courses, timeInfo: refreshed.data.timeInfo, currentWeek: refreshedWeek.week <= 0 ? 0 : refreshedWeek.week, weekNow: refreshedWeek.week, maxWeek: refreshedWeek.maxWeek, isFromLocal: refreshed.isFromLocal, isStale: refreshed.isStale, ...(refreshed.coursesRefreshed ? { ignoredCourseNames: [] } : {}) })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '课表刷新失败', isStale: hasLocal })
    } finally {
      set({ loading: false, refreshing: false })
    }
  },
  recalculateWeek: () => set((state) => {
    const weekInfo = calculateWeekInfo(state.timeInfo, new Date(), useAppStore.getState().school.weekStartDay)
    return { currentWeek: weekInfo.week <= 0 ? 0 : weekInfo.week, weekNow: weekInfo.week, maxWeek: weekInfo.maxWeek }
  }),
  clearRemote: () => set({ courses: [], timeInfo: null, currentWeek: 0, weekNow: 0, maxWeek: 0, isFromLocal: false, isStale: false, error: '' }),
  setCurrentWeek: (week) => set((state) => {
    if (state.maxWeek <= 0) return { currentWeek: 0 }
    let next = week
    if (next < 0) next = state.maxWeek
    if (next > state.maxWeek) next = 0
    return { currentWeek: next }
  }),
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
    set({ customCourses: assignCourseColors(customCourses) })
  },
  removeCustomCourse: (id) => {
    const customCourses = get().customCourses.filter((course) => course.id !== id)
    writeStorage(STORAGE_KEYS.CUSTOM_COURSES, customCourses)
    set({ customCourses })
  },
}))

export function selectVisibleCourses(state: CourseState): Course[] {
  const ignored = new Set(state.ignoredCourseNames)
  return [...state.courses.filter((course) => !ignored.has(course.courseName)), ...state.customCourses]
}

useAppStore.subscribe((state, previous) => {
  if (state.school.code !== previous.school.code) useCourseStore.getState().clearRemote()
  else if (state.school.weekStartDay !== previous.school.weekStartDay) useCourseStore.getState().recalculateWeek()
})
