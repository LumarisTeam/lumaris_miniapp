import { fetchBus, fetchElectricity, fetchElectricityWeekly, fetchLinks, fetchMapPois, fetchPayment, fetchProgram, fetchStudyProgress } from '@/api/education'
import type { BusTrip, ElectricPoint, FetchPolicy, FetchSnapshot, LinkCategory, MapPoi, PaymentRecord, PlanCourse, StudyModule } from '@/types/domain'
import { readCache, STORAGE_KEYS, writeCache } from '@/utils/storage'
import { filterUpcomingBusTrips } from '@/utils/education'

const SERVICE_TTL = 15 * 60 * 1000
const LONG_TTL = 60 * 60 * 1000

function isDomainArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.every((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
}

async function getSnapshot<T>(
  key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
  scope: string,
  fetcher: () => Promise<T>,
  policy: FetchPolicy,
  validate: (value: unknown) => value is T,
  ttl = SERVICE_TTL,
): Promise<FetchSnapshot<T>> {
  const cached = readCache(key, scope, validate)
  if (policy === 'local-first' && cached) {
    return { data: cached.data, isFromLocal: true, isStale: cached.expiresAt <= Date.now() }
  }
  try {
    const data = await fetcher()
    writeCache(key, data, scope, ttl)
    return { data, isFromLocal: false, isStale: false }
  } catch (error) {
    if (cached) return { data: cached.data, isFromLocal: true, isStale: true }
    throw error
  }
}

export function getBusSnapshot(date: string, schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<BusTrip[]>> {
  return getSnapshot(STORAGE_KEYS.BUS_CACHE, `${schoolCode.toUpperCase()}:${date}`, async () => filterUpcomingBusTrips(await fetchBus(date), date), policy, isDomainArray<BusTrip>)
}

export function getProgramSnapshot(studentId: string, name: string, schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<PlanCourse[]>> {
  return getSnapshot(STORAGE_KEYS.PROGRAM_CACHE, `${schoolCode.toUpperCase()}:${studentId}`, () => fetchProgram(studentId, name), policy, isDomainArray<PlanCourse>, LONG_TTL)
}

export function getStudyProgressSnapshot(studentId: string, schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<StudyModule[]>> {
  return getSnapshot(STORAGE_KEYS.STUDY_PROGRESS, `${schoolCode.toUpperCase()}:${studentId}`, fetchStudyProgress, policy, isDomainArray<StudyModule>, LONG_TTL)
}

export function getLinksSnapshot(schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<LinkCategory[]>> {
  return getSnapshot(STORAGE_KEYS.LINKS_CACHE, schoolCode.toUpperCase(), fetchLinks, policy, isDomainArray<LinkCategory>, LONG_TTL)
}

export function getMapSnapshot(schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<MapPoi[]>> {
  return getSnapshot(STORAGE_KEYS.MAP_CACHE, schoolCode.toUpperCase(), fetchMapPois, policy, isDomainArray<MapPoi>, LONG_TTL)
}

export interface ElectricityData {
  balance: number | null
  points: ElectricPoint[]
}

function isElectricityData(value: unknown): value is ElectricityData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<ElectricityData>
  return (data.balance === null || typeof data.balance === 'number') && Array.isArray(data.points)
}

export async function getElectricitySnapshot(studentId: string, schoolCode: string, sourceUrl: string, policy: FetchPolicy): Promise<FetchSnapshot<ElectricityData>> {
  const scope = `${schoolCode.toUpperCase()}:${studentId}:${sourceUrl.trim()}`
  const cached = readCache(STORAGE_KEYS.ELECTRICITY_CACHE, scope, isElectricityData)
  if (policy === 'local-first' && cached) return { data: cached.data, isFromLocal: true, isStale: cached.expiresAt <= Date.now() }
  const [balanceResult, pointsResult] = await Promise.allSettled([fetchElectricity(sourceUrl || undefined), fetchElectricityWeekly(sourceUrl || undefined)])
  if (balanceResult.status === 'rejected' && pointsResult.status === 'rejected') {
    if (cached) return { data: cached.data, isFromLocal: true, isStale: true }
    throw balanceResult.reason
  }
  const data = {
    balance: balanceResult.status === 'fulfilled' ? balanceResult.value : cached?.data.balance ?? null,
    points: pointsResult.status === 'fulfilled' ? pointsResult.value : cached?.data.points ?? [],
  }
  writeCache(STORAGE_KEYS.ELECTRICITY_CACHE, data, scope, SERVICE_TTL)
  return { data, isFromLocal: false, isStale: balanceResult.status === 'rejected' || pointsResult.status === 'rejected' }
}

export interface PaymentData {
  balance: number
  records: PaymentRecord[]
}

function isPaymentData(value: unknown): value is PaymentData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<PaymentData>
  return typeof data.balance === 'number' && Array.isArray(data.records)
}

export function getPaymentSnapshot(cardId: string, password: string, schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<PaymentData>> {
  const scope = `${schoolCode.toUpperCase()}:${cardId.trim()}`
  return getSnapshot(STORAGE_KEYS.PAYMENT_CACHE, scope, () => fetchPayment(cardId.trim(), password || undefined), policy, isPaymentData)
}
