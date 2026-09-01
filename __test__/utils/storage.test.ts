/* eslint-disable import/first */
const mockStorage: Record<string, unknown> = {}

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    getStorageSync: jest.fn((key: string) => mockStorage[key] ?? ''),
    setStorageSync: jest.fn((key: string, value: unknown) => { mockStorage[key] = value }),
    removeStorageSync: jest.fn((key: string) => { delete mockStorage[key] }),
  },
}))

import { clearEducationCache, migrateLegacyStorage, readCache, readStorage, removeStorage, STORAGE_KEYS, writeCache, writeStorage } from '@/utils/storage'

describe('versioned storage', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  test('reads, writes and removes namespaced values', () => {
    writeStorage(STORAGE_KEYS.SETTINGS, { theme: 'dark' })
    expect(mockStorage['lumaris:v1:settings']).toEqual({ theme: 'dark' })
    expect(readStorage(STORAGE_KEYS.SETTINGS, {})).toEqual({ theme: 'dark' })
    removeStorage(STORAGE_KEYS.SETTINGS)
    expect(readStorage(STORAGE_KEYS.SETTINGS, { theme: 'system' })).toEqual({ theme: 'system' })
  })

  test('migrates valid legacy data without persisting credentials', () => {
    mockStorage.lm_courseData = [{ name: '课程' }]
    mockStorage.lm_userData = { studentId: '20260001', name: '同学', cookie: 'session-cookie', schoolCode: 'XAUAT' }
    mockStorage.lm_credentials = { username: '20260001', password: 'secret' }
    migrateLegacyStorage()

    expect(mockStorage['lumaris:v1:courses']).toEqual([{ name: '课程' }])
    expect(mockStorage['lumaris:v1:session']).toMatchObject({ studentId: '20260001', cookie: 'session-cookie' })
    const migratedValues = Object.fromEntries(Object.entries(mockStorage).filter(([key]) => key.startsWith('lumaris:v1:')))
    expect(JSON.stringify(migratedValues)).not.toContain('secret')
    expect(mockStorage['lumaris:v1:legacy-migrated']).toBe(true)
  })

  test('discards incomplete legacy sessions', () => {
    mockStorage.lm_userData = { studentId: '20260001', cookie: '' }
    migrateLegacyStorage()
    expect(mockStorage['lumaris:v1:session']).toBeUndefined()
  })

  test('stores timestamped scoped cache and rejects another account', () => {
    writeCache(STORAGE_KEYS.SCORES, [{ semester: '2026-1' }], 'XAUAT:1001', 60_000)
    const own = readCache(STORAGE_KEYS.SCORES, 'XAUAT:1001', Array.isArray)
    expect(own?.data).toEqual([{ semester: '2026-1' }])
    expect(own?.expiresAt).toBeGreaterThan(own?.savedAt ?? 0)

    expect(readCache(STORAGE_KEYS.SCORES, 'XAUAT:1002', Array.isArray)).toBeNull()
    expect(mockStorage['lumaris:v1:scores']).toBeUndefined()
  })

  test('clears remote education data but preserves custom courses and todos', () => {
    writeStorage(STORAGE_KEYS.COURSES, ['remote'])
    writeStorage(STORAGE_KEYS.SCORES, ['remote'])
    writeStorage(STORAGE_KEYS.CUSTOM_COURSES, ['custom'])
    writeStorage(STORAGE_KEYS.TODOS, ['todo'])
    clearEducationCache()

    expect(readStorage(STORAGE_KEYS.COURSES, [])).toEqual([])
    expect(readStorage(STORAGE_KEYS.SCORES, [])).toEqual([])
    expect(readStorage(STORAGE_KEYS.CUSTOM_COURSES, [])).toEqual(['custom'])
    expect(readStorage(STORAGE_KEYS.TODOS, [])).toEqual(['todo'])
  })
})
