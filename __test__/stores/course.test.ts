/* eslint-disable import/first */
jest.mock('@/utils/storage', () => {
  const storage: Record<string, unknown> = {}
  return {
    __storage: storage,
    STORAGE_KEYS: new Proxy({}, { get: (_target, key) => String(key) }),
    initializeStorage: jest.fn(),
    readStorage: (_key: string, fallback: unknown) => fallback,
    writeStorage: jest.fn(),
    removeStorage: jest.fn(),
    clearEducationCache: jest.fn(),
  }
})

jest.mock('@/stores/app', () => ({
  useAppStore: {
    getState: () => ({
      school: { code: 'XAUAT', weekStartDay: 7, features: [] },
      settings: { visibleServices: [] },
    }),
    subscribe: () => () => {},
  },
  schoolSupports: () => true,
}))

jest.mock('@/services/courseRepository', () => ({
  getCourseBundle: jest.fn(),
  readCourseBundle: () => ({ data: { courses: [], timeInfo: null }, isFromLocal: true, isStale: false, coursesRefreshed: false }),
}))

jest.mock('@/services/scheduleTimeRepository', () => ({
  ensureScheduleTimeLoaded: jest.fn(),
}))

import { useCourseStore } from '@/stores/course'

describe('course store week paging', () => {
  beforeEach(() => {
    useCourseStore.setState({ currentWeek: 0, weekNow: 3, maxWeek: 18 })
  })

  test('jumps to the requested page', () => {
    useCourseStore.getState().setCurrentWeek(5)
    expect(useCourseStore.getState().currentWeek).toBe(5)
  })

  test('clamps at both ends instead of wrapping around', () => {
    useCourseStore.getState().setCurrentWeek(-1)
    expect(useCourseStore.getState().currentWeek).toBe(0)

    useCourseStore.getState().setCurrentWeek(99)
    expect(useCourseStore.getState().currentWeek).toBe(18)
  })

  test('stays on the all-courses page when the semester length is unknown', () => {
    useCourseStore.setState({ maxWeek: 0, currentWeek: 4 })
    useCourseStore.getState().setCurrentWeek(3)
    expect(useCourseStore.getState().currentWeek).toBe(0)
  })
})
