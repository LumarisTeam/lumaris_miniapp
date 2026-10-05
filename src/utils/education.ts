import { getStartAndEnd } from '@/utils/scheduleTime'
import type {
  BusTrip,
  Course,
  ElectricPoint,
  Exam,
  PaymentRecord,
  Score,
  ScoreList,
  Semester,
  TimeInfo,
} from '@/types/domain'

const COURSE_COLORS = [
  '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#af52de',
  '#ff2d55', '#5ac8fa', '#ffcc00', '#0a84ff', '#30d158', '#bf5af2',
]

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function toWeeks(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toNumber(item)).filter((week) => week > 0 && week <= 30)
}

export function normalizeCourse(raw: Record<string, unknown>, index = 0): Course {
  const rawTeachers = Array.isArray(raw.teachers)
    ? raw.teachers
    : typeof raw.teacher === 'string'
      ? [raw.teacher]
      : []
  const courseName = String(raw.courseName ?? raw.name ?? '')
  const startUnit = toNumber(raw.startUnit ?? raw.startSlot, 1)
  const weekday = Math.min(7, Math.max(1, toNumber(raw.weekday ?? raw.dayOfWeek, 1)))
  return {
    id: String(raw.id ?? raw.lessonId ?? `${courseName}-${weekday}-${startUnit}-${index}`),
    weekIndexes: toWeeks(raw.weekIndexes ?? raw.weeks),
    teachers: rawTeachers.map((teacher) => String(teacher ?? '')).filter(Boolean),
    room: String(raw.room ?? raw.location ?? ''),
    courseName,
    courseCode: String(raw.courseCode ?? ''),
    weekday,
    startUnit,
    endUnit: Math.max(startUnit, toNumber(raw.endUnit ?? raw.endSlot, startUnit)),
    credits: String(raw.credits ?? ''),
    lessonId: String(raw.lessonId ?? raw.id ?? ''),
    campus: String(raw.campus ?? ''),
    color: typeof raw.color === 'string' ? raw.color : COURSE_COLORS[index % COURSE_COLORS.length],
    isCustom: Boolean(raw.isCustom),
  }
}

export function assignCourseColors(courses: Course[]): Course[] {
  const byName = new Map<string, string>()
  return courses.map((course) => {
    if (!byName.has(course.courseName)) {
      byName.set(course.courseName, course.color || COURSE_COLORS[byName.size % COURSE_COLORS.length])
    }
    return { ...course, color: byName.get(course.courseName) || COURSE_COLORS[0] }
  })
}

export function normalizeTimeInfo(raw: Record<string, unknown>): TimeInfo {
  const extra: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!['startTime', 'startDate', 'endTime', 'endDate', 'semester'].includes(key) && typeof value === 'string') {
      extra[key] = value
    }
  }
  return {
    startTime: String(raw.startTime ?? raw.startDate ?? ''),
    endTime: String(raw.endTime ?? raw.endDate ?? ''),
    semester: String(raw.semester ?? ''),
    extra: Object.keys(extra).length ? extra : undefined,
  }
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeWeekStartDay(weekStartDay: number | undefined): 1 | 7 {
  return weekStartDay === 1 ? 1 : 7
}

export function getWeekStart(date: Date, weekStartDay: number): Date {
  const normalized = normalizeWeekStartDay(weekStartDay)
  const weekday = date.getDay() === 0 ? 7 : date.getDay()
  const daysSinceWeekStart = (weekday - normalized + 7) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceWeekStart)
}

export function calculateWeekInfo(info: TimeInfo | null, now = new Date(), weekStartDay = 7): { week: number; maxWeek: number } {
  const start = info?.startTime ? parseLocalDate(info.startTime) : null
  const end = info?.endTime ? parseLocalDate(info.endTime) : null
  if (!start || !end) return { week: 0, maxWeek: 0 }
  const startWeek = getWeekStart(start, weekStartDay)
  const currentWeek = getWeekStart(now, weekStartDay)
  const endWeek = getWeekStart(end, weekStartDay)
  return {
    week: Math.floor((currentWeek.getTime() - startWeek.getTime()) / 604800000) + 1,
    maxWeek: Math.floor((endWeek.getTime() - startWeek.getTime()) / 604800000) + 1,
  }
}

export function calculateCurrentWeek(info: TimeInfo | null, now = new Date(), weekStartDay = 7): number {
  return calculateWeekInfo(info, now, weekStartDay).week
}

export function getHomeCourses(
  courses: Course[],
  info: TimeInfo | null,
  weekStartDay: number,
  showTomorrow: boolean,
  now = new Date(),
): { courses: Course[]; isTomorrow: boolean } {
  const week = calculateCurrentWeek(info, now, weekStartDay)
  const weekday = now.getDay() || 7
  let visible = week > 0 ? coursesForDay(courses, week, weekday).filter((course) => {
    const { end } = getCourseTime(course, now)
    const [hour, minute] = end.split(':').map(Number)
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return true
    return now.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute).getTime()
  }) : []
  if (visible.length > 0 || !showTomorrow) return { courses: visible, isTomorrow: false }

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowWeek = calculateCurrentWeek(info, tomorrow, weekStartDay)
  visible = tomorrowWeek > 0 ? coursesForDay(courses, tomorrowWeek, tomorrow.getDay() || 7) : []
  return { courses: visible, isTomorrow: true }
}

export function orderedWeekdays(weekStartDay: number): number[] {
  return normalizeWeekStartDay(weekStartDay) === 1 ? [1, 2, 3, 4, 5, 6, 7] : [7, 1, 2, 3, 4, 5, 6]
}

export function coursesForWeek(courses: Course[], week: number): Course[] {
  return courses.filter((course) => course.weekIndexes.includes(week))
}

export function coursesForDay(courses: Course[], week: number, day: number): Course[] {
  return coursesForWeek(courses, week)
    .filter((course) => course.weekday === day)
    .sort((left, right) => left.startUnit - right.startUnit)
}

export function formatWeekRanges(weeks: number[]): string {
  if (weeks.length === 0) return ''
  const ranges: string[] = []
  let start = weeks[0]
  let end = weeks[0]
  for (const week of weeks.slice(1)) {
    if (week === end + 1) {
      end = week
    } else {
      ranges.push(start === end ? String(start) : `${start}-${end}`)
      start = week
      end = week
    }
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`)
  return ranges.join(',')
}

const ACADEMIC_YEAR_LABELS = ['大一', '大二', '大三', '大四', '大五', '大六', '大七', '大八', '大九', '大十']

export function academicYearLabel(index: number): string {
  return ACADEMIC_YEAR_LABELS[index] ?? String(index + 1)
}

export function buildSemesterLabels(count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const semesterIndex = count - index + 1
    return `${academicYearLabel(Math.floor(semesterIndex / 2) - 1)}${semesterIndex % 2 === 1 ? '下' : '上'}`
  })
}

/**
 * 取课程对应的起止时间。
 *
 * 时间来自当前生效的作息表（服务端 `GET /v1/course/ScheduleTime`，见
 * `@/services/scheduleTimeRepository`），未装载时用内置兜底表——不再是
 * 硬编码的季节判断。
 */
export function getCourseTime(course: Pick<Course, 'campus' | 'room' | 'startUnit' | 'endUnit'>, now = new Date()): { start: string; end: string } {
  return getStartAndEnd(course, now)
}

export function normalizeExam(raw: Record<string, unknown>, index = 0): Exam {
  const name = String(raw.name ?? raw.lessonName ?? '')
  return {
    id: String(raw.id ?? `${name}-${index}`),
    name,
    time: String(raw.time ?? raw.examTime ?? ''),
    location: String(raw.location ?? raw.room ?? ''),
    seat: String(raw.seat ?? raw.seatNo ?? ''),
  }
}

export function parseExamEndTime(timeText: string): Date | null {
  const match = /(\d{4})-(\d{2})-(\d{2}).*?(\d{2}):(\d{2})[-~](\d{2}):(\d{2})/.exec(timeText)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[6]), Number(match[7]))
}

export function isUpcomingExam(exam: Exam, now = new Date()): boolean {
  const endTime = parseExamEndTime(exam.time)
  return endTime ? endTime.getTime() >= now.getTime() : false
}

export function normalizeSemester(raw: Record<string, unknown>): Semester {
  const value = String(raw.value ?? raw.semester ?? '')
  return { value, text: String(raw.text ?? raw.name ?? value) }
}

export function normalizeScore(raw: Record<string, unknown>, index = 0): Score {
  const lessonName = String(raw.lessonName ?? raw.name ?? '')
  return {
    id: String(raw.id ?? `${raw.lessonCode ?? lessonName}-${index}`),
    name: String(raw.name ?? lessonName),
    lessonCode: String(raw.lessonCode ?? ''),
    lessonName,
    grade: String(raw.grade ?? ''),
    gpa: String(raw.gpa ?? ''),
    gradeDetail: String(raw.gradeDetail ?? ''),
    credit: String(raw.credit ?? ''),
    isMinor: Boolean(raw.isMinor),
  }
}

function validScoreNumber(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function calculateFlutterGpa(scores: Score[]): number {
  let credits = 0
  let weightedPoints = 0
  const bestByLessonCode = new Map<string, Score>()

  for (const score of scores) {
    if (!score.lessonCode) continue
    const existing = bestByLessonCode.get(score.lessonCode)
    if (!existing) {
      bestByLessonCode.set(score.lessonCode, score)
      continue
    }
    const existingGpa = validScoreNumber(existing.gpa)
    const newGpa = validScoreNumber(score.gpa)
    if (existingGpa !== null && newGpa !== null && newGpa > existingGpa) {
      bestByLessonCode.set(score.lessonCode, score)
    }
  }

  const add = (score: Score) => {
    const gpa = validScoreNumber(score.gpa)
    const credit = validScoreNumber(score.credit)
    if (gpa === null || credit === null || credit === 0) return
    credits += credit
    weightedPoints += credit * gpa
  }
  bestByLessonCode.forEach(add)
  scores.forEach((score) => { if (!score.isMinor) add(score) })
  return credits > 0 ? weightedPoints / credits : 0
}

export function calculateScoreSummary(scores: Score[]): { credits: number; weightedGpa: number; courses: number } {
  let credits = 0
  let courses = 0
  for (const score of scores) {
    const gpa = validScoreNumber(score.gpa)
    const credit = validScoreNumber(score.credit)
    if (gpa === null || credit === null || gpa === 0 || credit === 0) continue
    credits += credit
    courses += 1
  }
  return { credits, weightedGpa: calculateFlutterGpa(scores), courses }
}

export function calculateScoreListsSummary(scoreLists: ScoreList[]): { credits: number; weightedGpa: number; courses: number } {
  const allScores = scoreLists.flatMap((scoreList) => scoreList.list)
  return {
    credits: scoreLists.reduce((total, scoreList) => total + calculateScoreSummary(scoreList.list).credits, 0),
    weightedGpa: calculateFlutterGpa(allScores),
    courses: scoreLists.reduce((total, scoreList) => total + calculateScoreSummary(scoreList.list).courses, 0),
  }
}

export function normalizeBusTrip(raw: Record<string, unknown>, index = 0): BusTrip {
  const time = String(raw.departureTime ?? raw.runTime ?? raw.time ?? '').replace(/:\d{2}$/, '')
  const from = String(raw.departureStation ?? raw.from ?? raw.start ?? '')
  const to = String(raw.arrivalStation ?? raw.to ?? raw.end ?? '')
  const duration = String(raw.arrivalStationTime ?? '')
  let arrivalTime = ''
  const durationMatch = /^(?:\D)?(\d+):(\d+)$/.exec(duration)
  const timeMatch = /^(\d+):(\d+)$/.exec(time)
  if (durationMatch && timeMatch) {
    const minutes = Number(timeMatch[1]) * 60 + Number(timeMatch[2]) + Number(durationMatch[1]) * 60 + Number(durationMatch[2])
    arrivalTime = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
  }
  return {
    id: String(raw.id ?? `${raw.lineName ?? ''}-${time}-${from}-${to}-${index}`),
    lineName: String(raw.lineName ?? ''),
    description: String(raw.description ?? ''),
    departureTime: time,
    departureStation: from,
    arrivalStation: to,
    arrivalStationTime: duration.length > 1 ? duration.slice(1) : duration,
    arrivalTime,
    campus: String(raw.description ?? raw.campus ?? raw.lineName ?? ''),
  }
}

export function filterUpcomingBusTrips(trips: BusTrip[], date: string, now = new Date()): BusTrip[] {
  const pad = (value: number) => String(value).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  if (date !== today) return trips
  return trips.filter((trip) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(trip.departureTime)
    if (!match) return false
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(match[1]), Number(match[2])).getTime() > now.getTime()
  })
}

export function summarizeElectricity(points: ElectricPoint[], now = new Date()): { total: number; today: number; averageDaily: number; peak: ElectricPoint | null } {
  const daily = new Map<string, number>()
  let total = 0
  let today = 0
  let peak: ElectricPoint | null = null
  const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  for (const point of points) {
    const date = new Date(point.timestamp)
    const key = Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    total += point.value
    if (key) daily.set(key, (daily.get(key) ?? 0) + point.value)
    if (key === todayKey) today += point.value
    if (!peak || point.value > peak.value) peak = point
  }
  return { total, today, averageDaily: daily.size > 0 ? total / daily.size : 0, peak }
}

export function normalizePayment(raw: Record<string, unknown>, index = 0): PaymentRecord {
  return {
    id: String(raw.id ?? `${raw.datetimeStr ?? ''}-${index}`),
    turnoverType: String(raw.turnoverType ?? ''),
    datetime: String(raw.datetimeStr ?? raw.datetime ?? ''),
    description: String(raw.resume ?? raw.description ?? ''),
    amount: toNumber(raw.tranamt ?? raw.amount),
  }
}
