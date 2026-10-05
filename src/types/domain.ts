export interface ApiResponse<T> {
  data: T
  code: number | string
  message: string
  total?: number | null
}

export type Feature =
  | 'timetable'
  | 'grade_query'
  | 'gpa_calculation'
  | 'course_schedule'
  | 'exam_schedule'
  | 'login'
  | 'bus_schedule'
  | 'program'
  | 'study_progress'
  | 'electricity'
  | 'payment'
  | 'map'

export interface School {
  code: string
  name: string
  website: string
  features: Feature[]
  enabled: boolean
  weekStartDay: 1 | 7
}

export interface AuthSession {
  /** 登录时输入的教务账号，也是 Flutter 中展示和校园卡使用的真实学号。 */
  username: string
  /** 登录响应的 studentId，是课程、考试、成绩和培养计划接口使用的内部标识。 */
  educationId: string
  cookie: string
  schoolCode: string
}

export interface LoginResult {
  success: boolean
  studentId: string
  cookie: string
}

export interface Course {
  id: string
  weekIndexes: number[]
  teachers: string[]
  room: string
  courseName: string
  courseCode: string
  weekday: number
  startUnit: number
  endUnit: number
  credits: string
  lessonId: string
  campus: string
  color: string
  isCustom: boolean
}

/**
 * 一张作息表：某个校区在某个季节的节次起止时间。
 * 与服务端 `GET /v1/course/ScheduleTime` 返回的一项一一对应。
 */
export interface ScheduleTable {
  /** 校区名称，例如「草堂校区」「雁塔校区」 */
  campusName: string
  /** 适用区间，例如 `05/01~09/30`；不分季节的校区为空串 */
  timeRange: string
  /** 各节次的开始时间，下标即节次（0 是早自习，空串表示该节次没课） */
  start: string[]
  /** 各节次的结束时间，下标含义同 start */
  end: string[]
}

export interface TimeInfo {
  startTime: string
  endTime: string
  semester: string
  extra?: Record<string, string>
}

export type FetchPolicy = 'local-first' | 'refresh' | 'fallback-to-local'

export interface FetchSnapshot<T> {
  data: T
  isFromLocal: boolean
  isStale: boolean
}

export interface Exam {
  id: string
  name: string
  time: string
  location: string
  seat: string
}

export interface Semester {
  value: string
  text: string
}

export interface Score {
  id: string
  name: string
  lessonCode: string
  lessonName: string
  grade: string
  gpa: string
  gradeDetail: string
  credit: string
  isMinor: boolean
}

export interface ScoreList {
  semester: Semester
  list: Score[]
}

export interface BusTrip {
  id: string
  lineName: string
  description: string
  departureTime: string
  departureStation: string
  arrivalStation: string
  arrivalStationTime: string
  arrivalTime: string
  campus: string
}

export interface ElectricPoint {
  timestamp: string
  value: number
}

export interface ElectricitySubscription {
  email: string
  hasSubscription: boolean
  subscriptionId: string
  threshold: number
}

export interface PaymentRecord {
  id: string
  turnoverType: string
  datetime: string
  description: string
  amount: number
}

export interface PlanCourse {
  id: string
  name: string
  lessonType: string
  examMode: string
  courseTypeName: string
  credits: number
  term: string
}

export interface StudyModule {
  type: string
  total: { name: string; actual: number; full: number }
  other: Array<{ name: string; actual: number; full: number }>
}

export interface LinkItem {
  key: string
  name: string
  icon: string | null
  url: string
  description: string | null
  index: number
}

export interface LinkCategory {
  key: string
  name: string
  description: string | null
  icon: string
  index: number
  links: LinkItem[]
}

export interface MapPoi {
  id: string
  name: string
  category: string
  latitude: number
  longitude: number
  description: string
  address: string
  campus: string
  icon: string
  isActive: boolean
  sortOrder: string
}

export type ThemeMode = 'system' | 'light' | 'dark'
export type LocaleCode = 'system' | 'zh-CN' | 'zh-Hant' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'ru'
export type StartPage = 'home' | 'schedule' | 'score' | 'profile'
export type ServiceType = 'electricity' | 'bus' | 'payment'

export interface AppSettings {
  theme: ThemeMode
  /** 界面语言，system 表示跟随系统 */
  locale: LocaleCode
  startPage: StartPage
  hapticFeedback: boolean
  showTomorrow: boolean
  showCourseGrid: boolean
  visibleServices: ServiceType[]
}
