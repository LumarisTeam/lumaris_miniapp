import type {
  BusTrip,
  Course,
  Exam,
  PaymentRecord,
  Score,
  Semester,
  TimeInfo,
} from '@/types/domain'

const COURSE_COLORS = [
  '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#af52de',
  '#ff2d55', '#5ac8fa', '#ffcc00', '#0a84ff', '#30d158', '#bf5af2',
]

const CAOTANG_START = ['08:00', '08:30', '09:20', '10:25', '11:15', '12:10', '13:00', '14:00', '14:50', '15:45', '16:35', '19:30', '20:20']
const CAOTANG_END = ['08:20', '09:15', '10:05', '11:10', '12:00', '12:55', '13:45', '14:45', '15:35', '16:30', '17:20', '20:15', '21:05']
const YANTA_WINTER_START = ['', '08:00', '09:00', '10:10', '11:10', '', '', '14:00', '15:00', '16:00', '17:00', '19:30', '20:30']
const YANTA_WINTER_END = ['', '08:50', '09:50', '11:00', '12:00', '', '', '14:50', '15:50', '16:50', '17:50', '20:20', '21:20']
const YANTA_SUMMER_START = ['', '08:00', '09:00', '10:10', '11:10', '', '', '14:30', '15:30', '16:30', '17:30', '20:00', '21:00']
const YANTA_SUMMER_END = ['', '08:50', '09:50', '11:00', '12:00', '', '', '15:20', '16:20', '17:30', '18:20', '20:50', '21:50']

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
  const teachers = Array.isArray(raw.teachers) ? raw.teachers.join('、') : ''
  const name = String(raw.name ?? raw.courseName ?? '')
  const startSlot = toNumber(raw.startSlot ?? raw.startUnit, 1)
  const dayOfWeek = Math.min(7, Math.max(1, toNumber(raw.dayOfWeek ?? raw.weekday, 1)))
  return {
    id: String(raw.id ?? `${name}-${dayOfWeek}-${startSlot}-${index}`),
    name,
    teacher: String(raw.teacher ?? teachers),
    location: String(raw.location ?? raw.room ?? ''),
    campus: String(raw.campus ?? ''),
    weeks: toWeeks(raw.weeks ?? raw.weekIndexes),
    dayOfWeek,
    startSlot,
    endSlot: Math.max(startSlot, toNumber(raw.endSlot ?? raw.endUnit, startSlot)),
    color: typeof raw.color === 'string' ? raw.color : COURSE_COLORS[index % COURSE_COLORS.length],
    isCustom: Boolean(raw.isCustom),
  }
}

export function assignCourseColors(courses: Course[]): Course[] {
  const byName = new Map<string, string>()
  return courses.map((course) => {
    if (!byName.has(course.name)) {
      byName.set(course.name, course.color || COURSE_COLORS[byName.size % COURSE_COLORS.length])
    }
    return { ...course, color: byName.get(course.name) || COURSE_COLORS[0] }
  })
}

export function normalizeTimeInfo(raw: Record<string, unknown>): TimeInfo {
  const week = toNumber(raw.currentWeek)
  return {
    startTime: String(raw.startTime ?? raw.startDate ?? ''),
    endTime: String(raw.endTime ?? raw.endDate ?? ''),
    semester: String(raw.semester ?? ''),
    currentWeek: week > 0 ? week : undefined,
  }
}

export function calculateCurrentWeek(info: TimeInfo | null, now = new Date()): number {
  if (info?.currentWeek) return Math.min(30, Math.max(1, info.currentWeek))
  const start = info?.startTime ? new Date(info.startTime) : null
  if (!start || Number.isNaN(start.getTime())) return 1
  return Math.min(30, Math.max(1, Math.floor((now.getTime() - start.getTime()) / 604800000) + 1))
}

export function coursesForWeek(courses: Course[], week: number): Course[] {
  return courses.filter((course) => course.weeks.length === 0 || course.weeks.includes(week))
}

export function coursesForDay(courses: Course[], week: number, day: number): Course[] {
  return coursesForWeek(courses, week)
    .filter((course) => course.dayOfWeek === day)
    .sort((left, right) => left.startSlot - right.startSlot)
}

export function getCourseTime(course: Pick<Course, 'campus' | 'location' | 'startSlot' | 'endSlot'>, now = new Date()): { start: string; end: string } {
  const caotang = course.campus.includes('草堂') || course.location.startsWith('草堂')
  const summer = now.getMonth() + 1 >= 5 && now.getMonth() + 1 < 10
  const starts = caotang ? CAOTANG_START : summer ? YANTA_SUMMER_START : YANTA_WINTER_START
  const ends = caotang ? CAOTANG_END : summer ? YANTA_SUMMER_END : YANTA_WINTER_END
  return { start: starts[course.startSlot] ?? '', end: ends[course.endSlot] ?? '' }
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

export function normalizeSemester(raw: Record<string, unknown>): Semester {
  const value = String(raw.value ?? raw.semester ?? '')
  return { value, text: String(raw.text ?? raw.name ?? value) }
}

export function normalizeScore(raw: Record<string, unknown>, index = 0): Score {
  const lessonName = String(raw.lessonName ?? raw.name ?? '')
  return {
    id: String(raw.id ?? raw.lessonCode ?? `${lessonName}-${index}`),
    lessonCode: String(raw.lessonCode ?? ''),
    lessonName,
    grade: String(raw.grade ?? ''),
    gpa: toNumber(raw.gpa),
    gradeDetail: String(raw.gradeDetail ?? ''),
    credit: toNumber(raw.credit),
    isMinor: Boolean(raw.isMinor),
  }
}

export function calculateScoreSummary(scores: Score[]): { credits: number; weightedGpa: number; average: number } {
  let credits = 0
  let weightedGpa = 0
  let numericTotal = 0
  let numericCount = 0
  for (const score of scores) {
    credits += score.credit
    weightedGpa += score.gpa * score.credit
    const numericGrade = toNumber(score.grade, -1)
    if (numericGrade >= 0) {
      numericTotal += numericGrade
      numericCount += 1
    }
  }
  return {
    credits,
    weightedGpa: credits > 0 ? weightedGpa / credits : 0,
    average: numericCount > 0 ? numericTotal / numericCount : 0,
  }
}

export function normalizeBusTrip(raw: Record<string, unknown>, index = 0): BusTrip {
  const time = String(raw.departureTime ?? raw.runTime ?? raw.time ?? '').replace(/:\d{2}$/, '')
  const from = String(raw.departureStation ?? raw.from ?? raw.start ?? '')
  const to = String(raw.arrivalStation ?? raw.to ?? raw.end ?? '')
  return {
    id: String(raw.id ?? `${time}-${from}-${to}-${index}`),
    departureTime: time,
    departureStation: from,
    arrivalStation: to,
    campus: String(raw.description ?? raw.campus ?? raw.lineName ?? ''),
  }
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
