import type { Course, ExamItem, NumericLike, PaymentRecord, Semester, TimeInfo } from '@/types'

const CANTANG_START = ['8:00', '8:30', '9:20', '10:25', '11:15', '12:10', '13:00', '14:00', '14:50', '15:45', '16:35', '19:30', '20:20']
const CANTANG_END = ['8:20', '9:15', '10:05', '11:10', '12:00', '12:55', '13:45', '14:45', '15:35', '16:30', '17:20', '20:15', '21:05']
const YANTA_WINTER_START = ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:00', '15:00', '16:00', '17:00', '19:30', '20:30']
const YANTA_WINTER_END = ['', '8:50', '9:50', '11:00', '12:00', '', '', '14:50', '15:50', '16:50', '17:50', '20:20', '21:20']
const YANTA_SUMMER_START = ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:30', '15:30', '16:30', '17:30', '20:00', '21:00']
const YANTA_SUMMER_END = ['', '8:50', '9:50', '11:00', '12:00', '', '', '15:20', '16:20', '17:30', '18:20', '20:50', '21:50']

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '')).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value ? [value] : []
  }
  return []
}

export function toNumber(value: NumericLike, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function normalizeSemester(item: Record<string, unknown>): Semester {
  const value = String(item.value ?? item.semester ?? '')
  const text = String(item.text ?? item.name ?? value)
  return {
    semester: value,
    name: text,
    value,
    text,
  }
}

export function normalizeCourse(item: Record<string, unknown>): Course {
  const weeks = Array.isArray(item.weeks)
    ? item.weeks.map((week) => toNumber(week as NumericLike)).filter((week) => week > 0)
    : Array.isArray(item.weekIndexes)
      ? item.weekIndexes.map((week) => toNumber(week as NumericLike)).filter((week) => week > 0)
      : []

  const rawDay = toNumber((item.dayOfWeek ?? item.weekday) as NumericLike, 1)
  const dayOfWeek = rawDay >= 1 && rawDay <= 7 ? rawDay : ((rawDay % 7) + 7) % 7 + 1
  const teachers = toStringArray(item.teachers)

  return {
    name: String(item.name ?? item.courseName ?? ''),
    teacher: String(item.teacher ?? teachers.join(',') ?? ''),
    location: String(item.location ?? item.room ?? ''),
    weeks,
    dayOfWeek,
    startSlot: toNumber((item.startSlot ?? item.startUnit) as NumericLike),
    endSlot: toNumber((item.endSlot ?? item.endUnit) as NumericLike),
    color: typeof item.color === 'string' ? item.color : undefined,
    isCustom: Boolean(item.isCustom),
    campus: String(item.campus ?? ''),
  }
}

export function normalizeTimeInfo(item: Record<string, unknown>): TimeInfo {
  const startTime = String(item.startTime ?? item.startDate ?? '')
  const endTime = String(item.endTime ?? item.endDate ?? '')
  const semester = String(item.semester ?? '')
  const currentWeekValue = item.currentWeek == null ? undefined : toNumber(item.currentWeek as NumericLike)
  const extra: Record<string, string> = {}

  Object.entries(item).forEach(([key, value]) => {
    if (key === 'startTime' || key === 'startDate' || key === 'endTime' || key === 'endDate' || key === 'semester') {
      return
    }
    if (typeof value === 'string') {
      extra[key] = value
    }
  })

  return {
    startTime,
    endTime,
    semester,
    currentWeek: currentWeekValue && currentWeekValue > 0 ? currentWeekValue : undefined,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
  }
}

export function normalizePaymentRecord(item: Record<string, unknown>): PaymentRecord {
  return {
    turnoverType: String(item.turnoverType ?? ''),
    datetimeStr: String(item.datetimeStr ?? ''),
    resume: String(item.resume ?? ''),
    tranamt: typeof item.tranamt === 'number' || typeof item.tranamt === 'string' ? item.tranamt : 0,
  }
}

export function normalizeExam(item: Record<string, unknown>): ExamItem {
  return {
    name: String(item.name ?? ''),
    time: String(item.time ?? item.examTime ?? ''),
    location: String(item.location ?? item.room ?? ''),
    seat: String(item.seat ?? item.seatNo ?? ''),
  }
}

export function parseExamEndTime(timeText: string): Date | null {
  const match = /(\d{4})-(\d{2})-(\d{2}).*?(\d{2}):(\d{2})-(\d{2}):(\d{2})/.exec(timeText)
  if (!match) {
    return null
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[6]),
    Number(match[7]),
  )
}

export function isUpcomingExam(exam: ExamItem, now = new Date()): boolean {
  const endTime = parseExamEndTime(exam.time)
  return endTime ? endTime.getTime() >= now.getTime() : true
}

export function getCourseTimeRange(course: Course, now = new Date()): { start: string; end: string } {
  const isCaoTang = course.campus === '草堂校区' || course.location.startsWith('草堂')
  const month = now.getMonth() + 1
  const useSummerTime = month >= 5 && month < 10
  const startTable = isCaoTang ? CANTANG_START : useSummerTime ? YANTA_SUMMER_START : YANTA_WINTER_START
  const endTable = isCaoTang ? CANTANG_END : useSummerTime ? YANTA_SUMMER_END : YANTA_WINTER_END

  return {
    start: startTable[course.startSlot] ?? '',
    end: endTable[course.endSlot] ?? '',
  }
}

export function isCourseActiveForToday(course: Course, now = new Date()): boolean {
  const { end } = getCourseTimeRange(course, now)
  if (!end) {
    return true
  }

  const [hours, minutes] = end.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return true
  }

  const endTime = new Date(now)
  endTime.setHours(hours, minutes, 0, 0)
  return now.getTime() <= endTime.getTime()
}
