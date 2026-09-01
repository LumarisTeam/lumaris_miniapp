import { request, withQuery } from '@/api/client'
import type {
  BusTrip,
  Course,
  ElectricPoint,
  ElectricitySubscription,
  Exam,
  LinkCategory,
  LoginResult,
  MapPoi,
  PaymentRecord,
  PlanCourse,
  School,
  Score,
  Semester,
  StudyModule,
  TimeInfo,
} from '@/types/domain'
import {
  normalizeBusTrip,
  normalizeCourse,
  normalizeExam,
  normalizePayment,
  normalizeScore,
  normalizeSemester,
  normalizeTimeInfo,
  toNumber,
} from '@/utils/education'

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')) : []
}

export async function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/Login', {
    method: 'POST',
    data: { username, password },
    authenticated: false,
  })
}

export async function listSchools(): Promise<School[]> {
  const response = await request<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>('/api/v1/schools', { basic: true, authenticated: false })
  const items = Array.isArray(response) ? response : response.items ?? []
  return items.map((raw) => ({
    code: String(raw.code ?? 'XAUAT'),
    name: String(raw.name ?? '西安建筑科技大学'),
    website: String(raw.website ?? 'https://xauatapi.xauat.site'),
    features: Array.isArray(raw.features) ? (raw.features as School['features']) : [],
    enabled: raw.enabled !== false,
    weekStartDay: raw.week_start_day === 1 ? 1 : 7,
  }))
}

export async function fetchCourses(studentId: string): Promise<Course[]> {
  const raw = await request<unknown>(withQuery('/Course', { studentId }))
  return asRecords(raw).map(normalizeCourse)
}

export async function fetchTimeInfo(): Promise<TimeInfo> {
  const raw = await request<Record<string, unknown>>('/Info/Time')
  return normalizeTimeInfo(raw ?? {})
}

export async function fetchExams(studentId: string): Promise<Exam[]> {
  const raw = await request<unknown>(withQuery('/Exam', { studentId }))
  const records = Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items
  return asRecords(records).map(normalizeExam)
}

export async function fetchSemesters(studentId: string): Promise<Semester[]> {
  const raw = await request<unknown>(withQuery('/Score/Semester', { studentId }))
  return asRecords(raw).map(normalizeSemester)
}

export async function fetchScores(studentId: string, semester: string): Promise<Score[]> {
  const raw = await request<unknown>(withQuery('/Score', { studentId, semester }))
  return asRecords(raw).map(normalizeScore)
}

export async function fetchStudyProgress(): Promise<StudyModule[]> {
  const raw = await request<unknown>('/Info/Completion')
  return asRecords(raw).map((module) => {
    const total = module.total && typeof module.total === 'object' ? module.total as Record<string, unknown> : {}
    return {
      type: String(module.type ?? ''),
      total: { name: String(total.name ?? ''), actual: toNumber(total.actual), full: toNumber(total.full) },
      other: asRecords(module.other).map((item) => ({ name: String(item.name ?? ''), actual: toNumber(item.actual), full: toNumber(item.full) })),
    }
  })
}

export async function fetchBus(date: string): Promise<BusTrip[]> {
  const raw = await request<unknown>(`/Bus/${date}`)
  const records = Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items
  return asRecords(records).map(normalizeBusTrip)
}

export async function fetchElectricity(url?: string): Promise<number> {
  const value = await request<unknown>(withQuery('/Electricity', { url }))
  return toNumber(value)
}

export async function fetchElectricityWeekly(url?: string): Promise<ElectricPoint[]> {
  const raw = await request<unknown>(withQuery('/Electricity/WeeklyData', { url }))
  return asRecords(raw).map((item) => ({ timestamp: String(item.timestamp ?? item.Timestamp ?? item.time ?? ''), value: toNumber(item.value ?? item.Value) }))
}

export function fetchRechargeUrl(url?: string): Promise<string> {
  return request<string>(withQuery('/Electricity/RechargeUrl', { url }))
}

export function fetchElectricitySubscription(email: string): Promise<ElectricitySubscription> {
  return request<ElectricitySubscription>(withQuery('/Electricity/Subscriptions', { email }))
}

export function createElectricitySubscription(url: string, email: string, threshold: number): Promise<unknown> {
  return request('/Electricity/Subscriptions', { method: 'POST', data: { url, email, threshold } })
}

export function deleteElectricitySubscription(id: string): Promise<unknown> {
  return request(`/Electricity/Subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function fetchPayment(id: string, password?: string): Promise<{ balance: number; records: PaymentRecord[] }> {
  const raw = await request<{ balance?: unknown; records?: unknown[] }>(withQuery(`/Payment/${encodeURIComponent(id)}/turnover`, { password }))
  return { balance: toNumber(raw?.balance), records: asRecords(raw?.records).map(normalizePayment) }
}

export async function fetchProgram(id: string, _name?: string): Promise<PlanCourse[]> {
  const raw = await request<unknown>(withQuery('/Program/GetDic', { id }))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw as Record<string, unknown>).flatMap(([term, value]) => asRecords(value).map((item, index) => ({
    id: String(item.id ?? `${term}-${item.name ?? item.Name ?? ''}-${index}`),
    name: String(item.name ?? item.Name ?? ''),
    lessonType: String(item.lessonType ?? item.LessonType ?? ''),
    examMode: String(item.examMode ?? item.ExamMode ?? ''),
    courseTypeName: String(item.courseTypeName ?? item.CourseTypeName ?? ''),
    credits: toNumber(item.credits ?? item.Credits),
    term,
  })))
}

export async function fetchLinks(): Promise<LinkCategory[]> {
  const raw = await request<unknown>('/SchoolNav')
  return asRecords(raw).map((category) => ({
    key: String(category.key ?? ''),
    name: String(category.name ?? ''),
    description: category.description == null ? null : String(category.description),
    icon: String(category.icon ?? ''),
    index: toNumber(category.index),
    links: asRecords(category.links).map((link) => ({
      key: String(link.key ?? ''),
      name: String(link.name ?? ''),
      icon: link.icon == null ? null : String(link.icon),
      url: String(link.url ?? ''),
      description: link.description == null ? null : String(link.description),
      index: toNumber(link.index),
    })).sort((left, right) => left.index - right.index),
  })).sort((left, right) => left.index - right.index)
}

export async function fetchMapPois(): Promise<MapPoi[]> {
  const raw = await request<unknown>('/Map')
  return asRecords(raw)
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      category: String(item.category ?? '其他'),
      latitude: toNumber(item.latitude),
      longitude: toNumber(item.longitude),
      description: String(item.description ?? ''),
      address: String(item.address ?? ''),
      campus: String(item.campus ?? ''),
      icon: String(item.icon ?? ''),
      isActive: (item.is_active ?? item.isActive) !== false,
      sortOrder: String(item.sort_order ?? item.sortOrder ?? ''),
    }))
    .filter((item) => item.id && item.latitude !== 0 && item.longitude !== 0 && item.isActive)
    .sort((left, right) => left.sortOrder.localeCompare(right.sortOrder, undefined, { numeric: true }) || left.name.localeCompare(right.name, 'zh-CN'))
}
