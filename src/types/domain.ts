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
export type StartPage = 'home' | 'schedule' | 'score' | 'profile'
export type ServiceType = 'electricity' | 'bus' | 'payment'

export interface AppSettings {
  theme: ThemeMode
  startPage: StartPage
  hapticFeedback: boolean
  showTomorrow: boolean
  showCourseGrid: boolean
  visibleServices: ServiceType[]
}
