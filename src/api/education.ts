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
  ScheduleTable,
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
import { normalizeScheduleTables } from '@/utils/scheduleTime'

/** 服务端可能返回 camelCase 或 PascalCase，Flutter 的 PlanCourse 两种都读。 */
function normalizePlanCourse(item: Record<string, unknown>, term: string, index: number): PlanCourse {
  const name = String(item.name ?? item.Name ?? '')
  return {
    id: String(item.id ?? `${term}-${name}-${index}`),
    name,
    lessonType: String(item.lessonType ?? item.LessonType ?? ''),
    examMode: String(item.examMode ?? item.ExamMode ?? ''),
    courseTypeName: String(item.courseTypeName ?? item.CourseTypeName ?? ''),
    credits: toNumber(item.credits ?? item.Credits),
    term: term || String(item.termStr ?? item.TermStr ?? ''),
  }
}

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

export async function fetchCourses(studentId: string): Promise<Course[]> {
  const raw = await request<unknown>(withQuery('/Course', { studentId }))
  return asRecords(raw).map(normalizeCourse)
}

export async function fetchTimeInfo(): Promise<TimeInfo> {
  const raw = await request<Record<string, unknown>>('/Info/Time')
  return normalizeTimeInfo(raw ?? {})
}

/**
 * 获取各校区、各季节的作息时间表（草堂一份，雁塔冬季/夏季各一份）。
 * 服务端返回裸数组，也兼容带 data 包装的响应；服务端不做校区判断，
 * 由调用方按课程校区字段和当前日期自行选择。
 */
export async function fetchScheduleTime(): Promise<ScheduleTable[]> {
  const raw = await request<unknown>('/course/ScheduleTime')
  return normalizeScheduleTables(raw)
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

/**
 * 新版校车数据（`GET /Bus/NewData/{time}?loc=`）。
 *
 * 与 Flutter `BusApi.getBusNewData` 对齐。Flutter 的页面只用 `/Bus/{date}`，
 * 这两个接口目前没有调用方；保留是为了接口层与后端契约一致，接入前先确认
 * 服务端返回结构未变。
 */
export async function fetchBusNewData(time: string, loc = 'ALL'): Promise<BusTrip[]> {
  const raw = await request<unknown>(withQuery(`/Bus/NewData/${time}`, { loc }))
  const records = Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items
  return asRecords(records).map(normalizeBusTrip)
}

/** 旧版校车数据（`GET /Bus/OldData/{time}?isShow=`），与 Flutter `BusApi.getBusOldData` 对齐。 */
export async function fetchBusOldData(time: string, isShow = false): Promise<BusTrip[]> {
  const raw = await request<unknown>(withQuery(`/Bus/OldData/${time}`, { isShow }))
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

/**
 * 培养方案扁平列表（`GET /Program?id=&name=`）。
 *
 * 与 Flutter `ProgramApi.getProgram` 对齐。页面用的是 `/Program/GetDic` 的分组
 * 结果（Flutter 的 `ProgramPage` 也只读分组接口），这个方法留给按名称检索。
 */
export async function fetchProgramList(id: string, name?: string): Promise<PlanCourse[]> {
  const raw = await request<unknown>(withQuery('/Program', { id, name }))
  return asRecords(raw).map((item, index) => normalizePlanCourse(item, '', index))
}

export async function fetchProgram(id: string): Promise<PlanCourse[]> {
  const raw = await request<unknown>(withQuery('/Program/GetDic', { id }))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw as Record<string, unknown>).flatMap(([term, value]) => asRecords(value).map((item, index) => normalizePlanCourse(item, term, index)))
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
