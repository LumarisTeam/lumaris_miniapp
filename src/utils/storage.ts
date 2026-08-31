import Taro from '@tarojs/taro'
import type { AuthSession } from '@/types/domain'

const PREFIX = 'lumaris:v1:'

export const STORAGE_KEYS = {
  SESSION: 'session',
  SCHOOL: 'school',
  SETTINGS: 'settings',
  COURSES: 'courses',
  CUSTOM_COURSES: 'custom-courses',
  IGNORED_COURSES: 'ignored-courses',
  TIME_INFO: 'time-info',
  TODOS: 'todos',
  EXAMS: 'exams',
  ELECTRICITY_URL: 'electricity-url',
  ELECTRICITY_EMAIL: 'electricity-email',
  PAYMENT_ID: 'payment-id',
  MIGRATED: 'legacy-migrated',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

function fullKey(key: StorageKey): string {
  return `${PREFIX}${key}`
}

export function readStorage<T>(key: StorageKey, fallback: T): T {
  try {
    const value = Taro.getStorageSync(fullKey(key))
    return value === '' || value === undefined || value === null ? fallback : (value as T)
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: StorageKey, value: T): void {
  try {
    Taro.setStorageSync(fullKey(key), value)
  } catch (error) {
    console.warn(`Storage write failed: ${key}`, error)
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    Taro.removeStorageSync(fullKey(key))
  } catch (error) {
    console.warn(`Storage remove failed: ${key}`, error)
  }
}

function validSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<AuthSession>
  return Boolean(
    typeof session.studentId === 'string' &&
      session.studentId &&
      typeof session.cookie === 'string' &&
      session.cookie,
  )
}

const LEGACY_MAPPINGS: Array<[string, StorageKey]> = [
  ['lm_courseData', STORAGE_KEYS.COURSES],
  ['lm_guestCourseData', STORAGE_KEYS.COURSES],
  ['lm_customCourses', STORAGE_KEYS.CUSTOM_COURSES],
  ['lm_ignoredCourses', STORAGE_KEYS.IGNORED_COURSES],
  ['lm_settings', STORAGE_KEYS.SETTINGS],
  ['lm_electricityUrl', STORAGE_KEYS.ELECTRICITY_URL],
]

export function migrateLegacyStorage(): void {
  if (readStorage(STORAGE_KEYS.MIGRATED, false)) return

  for (const [legacyKey, targetKey] of LEGACY_MAPPINGS) {
    try {
      const legacyValue = Taro.getStorageSync(legacyKey)
      if (legacyValue !== '' && legacyValue !== undefined && legacyValue !== null) {
        writeStorage(targetKey, legacyValue)
      }
    } catch {
      // Ignore a single malformed legacy entry and continue migrating others.
    }
  }

  try {
    const oldUser = Taro.getStorageSync('lm_userData') as Record<string, unknown> | undefined
    const candidate: AuthSession = {
      studentId: String(oldUser?.studentId ?? ''),
      displayName: String(oldUser?.name ?? oldUser?.studentId ?? ''),
      cookie: String(oldUser?.cookie ?? ''),
      schoolCode: String(oldUser?.schoolCode ?? 'XAUAT'),
    }
    if (validSession(candidate)) writeStorage(STORAGE_KEYS.SESSION, candidate)
  } catch {
    // A broken legacy login is safer to discard than partially restore.
  }

  writeStorage(STORAGE_KEYS.MIGRATED, true)
}

export function initializeStorage(): void {
  migrateLegacyStorage()
}
