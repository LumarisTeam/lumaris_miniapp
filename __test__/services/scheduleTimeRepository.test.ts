/* eslint-disable import/first */
const mockFetchScheduleTime = jest.fn()
const mockReadCache = jest.fn()
const mockWriteCache = jest.fn()

jest.mock('@/api/education', () => ({
  fetchScheduleTime: (...args: unknown[]) => mockFetchScheduleTime(...args),
}))

jest.mock('@/utils/storage', () => ({
  STORAGE_KEYS: { SCHEDULE_TIME: 'schedule-time' },
  readCache: (...args: unknown[]) => mockReadCache(...args),
  writeCache: (...args: unknown[]) => mockWriteCache(...args),
}))

import {
  fetchScheduleTimeFromRemote,
  loadScheduleTimeFromCache,
  scheduleTimeScope,
} from '@/services/scheduleTimeRepository'
import { CAOTANG_CAMPUS, YANTA_CAMPUS, getStartAndEndForCampus, isUsingRemoteTables, resetToBuiltInTables } from '@/utils/scheduleTime'

const caotangRemote = { campusName: CAOTANG_CAMPUS, timeRange: '', start: ['07:00', '07:30'], end: ['07:45', '08:15'] }

function cacheEntry(data: unknown) {
  return { data, savedAt: 1, expiresAt: Date.now() + 60_000, scope: 'XAUAT' }
}

describe('schedule time repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReadCache.mockReturnValue(null)
    resetToBuiltInTables()
  })

  afterEach(() => resetToBuiltInTables())

  test('scopes the cache by uppercased school code', () => {
    expect(scheduleTimeScope('xauat')).toBe('XAUAT')
    expect(scheduleTimeScope(' Xauat ')).toBe('XAUAT')
  })

  test('loads tables from cache and reports success', () => {
    mockReadCache.mockReturnValue(cacheEntry([caotangRemote]))

    expect(loadScheduleTimeFromCache('XAUAT')).toBe(true)
    expect(isUsingRemoteTables()).toBe(true)
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '07:30', end: '08:15' })
    expect(mockFetchScheduleTime).not.toHaveBeenCalled()
  })

  test('keeps the built-in table when there is no cache', () => {
    expect(loadScheduleTimeFromCache('XAUAT')).toBe(false)
    expect(isUsingRemoteTables()).toBe(false)
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '8:30', end: '9:15' })
  })

  test('reuses the cache without hitting the network when not forced', async () => {
    mockReadCache.mockReturnValue(cacheEntry([caotangRemote]))

    await expect(fetchScheduleTimeFromRemote('XAUAT')).resolves.toBe(true)
    expect(mockFetchScheduleTime).not.toHaveBeenCalled()
    expect(mockWriteCache).not.toHaveBeenCalled()
  })

  test('fetches, caches and installs the remote table', async () => {
    mockFetchScheduleTime.mockResolvedValue([caotangRemote])

    await expect(fetchScheduleTimeFromRemote('XAUAT', true)).resolves.toBe(true)
    expect(mockWriteCache).toHaveBeenCalledWith('schedule-time', [caotangRemote], 'XAUAT', expect.any(Number))
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '07:30', end: '08:15' })
  })

  test('normalizes PascalCase payloads before caching', async () => {
    mockFetchScheduleTime.mockResolvedValue([
      { CampusName: YANTA_CAMPUS, Time: '05/01~09/30', Start: ['09:00'], End: ['09:45'] },
    ])

    await expect(fetchScheduleTimeFromRemote('XAUAT', true)).resolves.toBe(true)
    expect(mockWriteCache).toHaveBeenCalledWith(
      'schedule-time',
      [{ campusName: YANTA_CAMPUS, timeRange: '05/01~09/30', start: ['09:00'], end: ['09:45'] }],
      'XAUAT',
      expect.any(Number),
    )
  })

  test('keeps the current table when the request fails', async () => {
    mockReadCache.mockReturnValue(cacheEntry([caotangRemote]))
    loadScheduleTimeFromCache('XAUAT')
    mockFetchScheduleTime.mockRejectedValue(new Error('offline'))

    await expect(fetchScheduleTimeFromRemote('XAUAT', true)).resolves.toBe(false)
    expect(mockWriteCache).not.toHaveBeenCalled()
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '07:30', end: '08:15' })
  })

  test('does not overwrite a usable table with an empty response', async () => {
    mockReadCache.mockReturnValue(cacheEntry([caotangRemote]))
    loadScheduleTimeFromCache('XAUAT')
    mockFetchScheduleTime.mockResolvedValue([])

    await expect(fetchScheduleTimeFromRemote('XAUAT', true)).resolves.toBe(false)
    expect(mockWriteCache).not.toHaveBeenCalled()
    expect(isUsingRemoteTables()).toBe(true)
  })
})
