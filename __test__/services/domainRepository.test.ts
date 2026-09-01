/* eslint-disable import/first */
const mockFetchBus = jest.fn()
const mockReadCache = jest.fn()
const mockWriteCache = jest.fn()

jest.mock('@/api/education', () => ({
  fetchBus: (...args: unknown[]) => mockFetchBus(...args),
  fetchElectricity: jest.fn(),
  fetchElectricityWeekly: jest.fn(),
  fetchLinks: jest.fn(),
  fetchMapPois: jest.fn(),
  fetchPayment: jest.fn(),
  fetchProgram: jest.fn(),
  fetchStudyProgress: jest.fn(),
}))

jest.mock('@/utils/storage', () => ({
  STORAGE_KEYS: { BUS_CACHE: 'bus-cache' },
  readCache: (...args: unknown[]) => mockReadCache(...args),
  writeCache: (...args: unknown[]) => mockWriteCache(...args),
}))

import { getBusSnapshot } from '@/services/domainRepository'

const cachedTrips = [{
  id: '1', lineName: '一号线', description: '', departureTime: '08:00', departureStation: '雁塔', arrivalStation: '草堂', arrivalStationTime: '01:00', arrivalTime: '09:00', campus: '',
}]

describe('domain repository fetch policy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReadCache.mockReturnValue(null)
  })

  test('returns local data immediately for local-first', async () => {
    mockReadCache.mockReturnValue({ data: cachedTrips, savedAt: 1, expiresAt: Date.now() + 1000, scope: 'XAUAT:2026-09-01' })
    await expect(getBusSnapshot('2026-09-01', 'XAUAT', 'local-first')).resolves.toMatchObject({ data: cachedTrips, isFromLocal: true, isStale: false })
    expect(mockFetchBus).not.toHaveBeenCalled()
  })

  test('falls back to cache and marks it stale when refresh fails', async () => {
    mockReadCache.mockReturnValue({ data: cachedTrips, savedAt: 1, expiresAt: Date.now() + 1000, scope: 'XAUAT:2026-09-01' })
    mockFetchBus.mockRejectedValue(new Error('offline'))
    await expect(getBusSnapshot('2026-09-01', 'XAUAT', 'refresh')).resolves.toMatchObject({ data: cachedTrips, isFromLocal: true, isStale: true })
  })

  test('writes fresh remote results using the date and school scope', async () => {
    mockFetchBus.mockResolvedValue(cachedTrips)
    await expect(getBusSnapshot('2099-09-01', 'XAUAT', 'refresh')).resolves.toMatchObject({ data: cachedTrips, isFromLocal: false })
    expect(mockWriteCache).toHaveBeenCalledWith('bus-cache', cachedTrips, 'XAUAT:2099-09-01', expect.any(Number))
  })
})
