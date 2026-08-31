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
  studentId: string
  displayName: string
  cookie: string
  schoolCode: string
}

export interface LoginResult {
  success: boolean
  studentId: string
  cookie: string
  name?: string
}

export interface Course {
  id: string
  name: string
  teacher: string
  location: string
  campus: string
  weeks: number[]
  dayOfWeek: number
  startSlot: number
  endSlot: number
  color: string
  isCustom: boolean
}

export interface TimeInfo {
  startTime: string
  endTime: string
  semester: string
  currentWeek?: number
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
  lessonCode: string
  lessonName: string
  grade: string
  gpa: number
  gradeDetail: string
  credit: number
  isMinor: boolean
}

export interface BusTrip {
  id: string
  departureTime: string
  departureStation: string
  arrivalStation: string
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

export interface MapPoi {
  id: number
  name: string
  category: string
  latitude: number
  longitude: number
  description: string
  address: string
  campus: string
  isActive: boolean
}

export interface TodoItem {
  id: string
  title: string
  deadline: string
  isCompleted: boolean
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
