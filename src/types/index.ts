export interface ApiResponse<T> {
  data: T
  code: number | string
  message: string
  total?: number | null
}

export interface LoginResponse {
  success: boolean
  studentId: string
  cookie: string
}

export interface UserData {
  studentId: string
  name: string
  cookie: string
  schoolCode: string
}

export interface Course {
  name: string
  teacher: string
  location: string
  weeks: number[]
  dayOfWeek: number
  startSlot: number
  endSlot: number
  color?: string
  isCustom?: boolean
}

export interface ScoreItem {
  name: string
  lessonCode: string
  lessonName: string
  grade: string
  gpa: number
  gradeDetail: string
  credit: number
  isMinor: boolean
}

export interface Semester {
  value: string
  text: string
}

export interface ExamItem {
  name: string
  time: string
  location: string
  seat: string
}

export interface BusItem {
  id: string
  departureTime: string
  departureStation: string
  arrivalStation: string
  campus: string
}

export interface ElectricDataPoint {
  timestamp: string
  value: number
}

export interface PaymentRecord {
  turnoverType: string
  datetimeStr: string
  resume: string
  tranamt: number
}

export interface PlanCourse {
  name: string
  lessonType: string
  examMode: string
  courseTypeName: string
  credits: number
  termStr: string
}

export interface StudyModule {
  type: string
  total: { name: string; actual: number; full: number }
  other: { name: string; actual: number; full: number }[]
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
  icon: string | null
  isActive: boolean
  sortOrder: number
}

export interface School {
  code: string
  name: string
  website: string
  features: string[]
}

export interface ReleaseInfo {
  id: number
  tagName: string
  name: string
  body: string
  author: { login: string; avatarUrl: string }
  createdAt: string
}

export type TileType = 'electricity' | 'bus' | 'payment'

export interface TileConfig {
  type: TileType
  visible: boolean
  order: number
}

export type ThemeMode = 'system' | 'light' | 'dark'
export type Locale = 'zh-CN' | 'en'
