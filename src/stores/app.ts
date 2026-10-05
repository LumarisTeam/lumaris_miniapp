import { create } from 'zustand'
import { fetchSchoolDetail, listSchools } from '@/api/basic'
import { applyLocaleToShell } from '@/i18n/applyLocale'
import type { AppSettings, Feature, School } from '@/types/domain'
import { clearEducationCache, initializeStorage, readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'

initializeStorage()

export const DEFAULT_SCHOOL: School = {
  code: 'XAUAT',
  name: '西安建筑科技大学',
  website: 'https://xauatapi.xauat.site',
  features: [
    'timetable', 'grade_query', 'gpa_calculation', 'course_schedule',
    'exam_schedule', 'login', 'bus_schedule', 'program', 'study_progress',
    'electricity', 'payment', 'map',
  ],
  enabled: true,
  weekStartDay: 7,
  // 兜底学校与 Flutter 的 School.fallbackList 保持一致：未登记教务系统地址。
  eduSystemUrl: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  locale: 'system',
  startPage: 'home',
  hapticFeedback: true,
  showTomorrow: false,
  showCourseGrid: true,
  visibleServices: ['electricity', 'bus', 'payment'],
}

interface AppState {
  settings: AppSettings
  school: School
  schools: School[]
  schoolsLoading: boolean
  setSettings: (patch: Partial<AppSettings>) => void
  setSchool: (school: School) => void
  /** 拉取当前学校的最新配置（功能开关可能被服务端改过）。 */
  refreshSchoolDetail: (code: string) => Promise<void>
  loadSchools: () => Promise<void>
}

const savedSettings = readStorage<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {})
const initialSettings: AppSettings = {
  ...DEFAULT_SETTINGS,
  ...savedSettings,
  visibleServices: Array.isArray(savedSettings.visibleServices)
    ? savedSettings.visibleServices
    : DEFAULT_SETTINGS.visibleServices,
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: initialSettings,
  school: readStorage<School>(STORAGE_KEYS.SCHOOL, DEFAULT_SCHOOL),
  schools: [DEFAULT_SCHOOL],
  schoolsLoading: false,
  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    writeStorage(STORAGE_KEYS.SETTINGS, settings)
    set({ settings })
    if (patch.locale !== undefined) applyLocaleToShell()
  },
  setSchool: (school) => {
    if (get().school.code.toUpperCase() !== school.code.toUpperCase()) clearEducationCache()
    writeStorage(STORAGE_KEYS.SCHOOL, school)
    set({ school })
    void get().refreshSchoolDetail(school.code)
  },
  refreshSchoolDetail: async (code) => {
    const target = code.trim().toUpperCase()
    try {
      const detail = await fetchSchoolDetail(target)
      // 请求期间又切了学校就丢弃结果，避免把旧学校的功能开关盖上去。
      if (get().school.code.toUpperCase() !== target) return
      writeStorage(STORAGE_KEYS.SCHOOL, detail)
      set({ school: detail })
    } catch {
      // 拿不到远端配置就继续用缓存里的那份，不阻断任何流程。
    }
  },
  loadSchools: async () => {
    set({ schoolsLoading: true })
    try {
      const schools = (await listSchools()).filter((school) => school.enabled && school.features.includes('login'))
      set({ schools: schools.length ? schools : [DEFAULT_SCHOOL] })
    } catch {
      set({ schools: [DEFAULT_SCHOOL] })
    } finally {
      set({ schoolsLoading: false })
    }
  },
}))

export function schoolSupports(feature: Feature): boolean {
  return useAppStore.getState().school.features.includes(feature)
}
