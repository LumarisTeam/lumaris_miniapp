import { create } from 'zustand'
import { listSchools } from '@/api/education'
import type { AppSettings, Feature, School, ServiceType } from '@/types/domain'
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
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
  loadSchools: () => Promise<void>
  toggleService: (service: ServiceType) => void
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
  },
  setSchool: (school) => {
    if (get().school.code.toUpperCase() !== school.code.toUpperCase()) clearEducationCache()
    writeStorage(STORAGE_KEYS.SCHOOL, school)
    set({ school })
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
  toggleService: (service) => {
    const current = get().settings.visibleServices
    const visibleServices = current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service]
    get().setSettings({ visibleServices })
  },
}))

export function schoolSupports(feature: Feature): boolean {
  return useAppStore.getState().school.features.includes(feature)
}
