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
  SEMESTERS: 'semesters',
  SCORES: 'scores',
  STUDY_PROGRESS: 'study-progress',
  ELECTRICITY_URL: 'electricity-url',
  ELECTRICITY_EMAIL: 'electricity-email',
  PAYMENT_ID: 'payment-id',
  BUS_CACHE: 'bus-cache',
  ELECTRICITY_CACHE: 'electricity-cache',
  PAYMENT_CACHE: 'payment-cache',
  PROGRAM_CACHE: 'program-cache',
  LINKS_CACHE: 'links-cache',
  MAP_CACHE: 'map-cache',
  MIGRATED: 'legacy-migrated',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export interface CacheEntry<T> {
  data: T
  savedAt: number
  expiresAt: number
  scope: string
}

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

export function writeCache<T>(key: StorageKey, data: T, scope: string, ttlMs: number): CacheEntry<T> {
  const savedAt = Date.now()
  const entry = { data, savedAt, expiresAt: savedAt + ttlMs, scope }
  writeStorage(key, entry)
  return entry
}

export function readCache<T>(key: StorageKey, scope: string, validate: (value: unknown) => value is T): CacheEntry<T> | null {
  const value = readStorage<unknown>(key, null)
  if (!value || typeof value !== 'object') return null
  const entry = value as Partial<CacheEntry<unknown>>
  if (
    entry.scope !== scope ||
    typeof entry.savedAt !== 'number' ||
    typeof entry.expiresAt !== 'number' ||
    !validate(entry.data)
  ) {
    removeStorage(key)
    return null
  }
  return entry as CacheEntry<T>
}

const EDUCATION_CACHE_KEYS: StorageKey[] = [
  STORAGE_KEYS.COURSES,
  STORAGE_KEYS.TIME_INFO,
  STORAGE_KEYS.EXAMS,
  STORAGE_KEYS.SEMESTERS,
  STORAGE_KEYS.SCORES,
  STORAGE_KEYS.STUDY_PROGRESS,
  STORAGE_KEYS.BUS_CACHE,
  STORAGE_KEYS.ELECTRICITY_CACHE,
  STORAGE_KEYS.PAYMENT_CACHE,
  STORAGE_KEYS.PROGRAM_CACHE,
  STORAGE_KEYS.LINKS_CACHE,
  STORAGE_KEYS.MAP_CACHE,
]

export function clearEducationCache(): void {
  EDUCATION_CACHE_KEYS.forEach(removeStorage)
}

function validSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<AuthSession>
  return Boolean(
    typeof session.username === 'string' &&
      session.username &&
      typeof session.educationId === 'string' &&
      session.educationId &&
      typeof session.cookie === 'string' &&
      session.cookie &&
      typeof session.schoolCode === 'string' &&
      session.schoolCode,
  )
}

function discardInvalidCurrentSession(): void {
  const session = readStorage<unknown>(STORAGE_KEYS.SESSION, null)
  if (session && !validSession(session)) removeStorage(STORAGE_KEYS.SESSION)
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
    const oldCredentials = Taro.getStorageSync('lm_credentials') as Record<string, unknown> | undefined
    const candidate: AuthSession = {
      username: String(oldCredentials?.username ?? ''),
      educationId: String(oldUser?.studentId ?? ''),
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
  discardInvalidCurrentSession()
}
