let systemInfo: UniApp.GetSystemInfoResult | null = null

export function getSystemInfo(): UniApp.GetSystemInfoResult {
  if (!systemInfo) {
    systemInfo = uni.getSystemInfoSync()
  }
  return systemInfo
}

export function isDarkMode(): boolean {
  const info = getSystemInfo()
  return info.theme === 'dark'
}

export function getStatusBarHeight(): number {
  return getSystemInfo().statusBarHeight ?? 20
}

export function getWindowWidth(): number {
  return getSystemInfo().windowWidth
}

export function getPlatform(): string {
  return getSystemInfo().platform
}

export function rpxToPx(rpx: number): number {
  const info = getSystemInfo()
  return (rpx * info.windowWidth) / 750
}

export function getMenuButtonInfo(): UniApp.GetMenuButtonBoundingClientRectRes | null {
  // #ifdef MP-WEIXIN
  try {
    return uni.getMenuButtonBoundingClientRect()
  } catch {
    return null
  }
  // #endif
  return null
}

export const FEATURES = {
  timetable: 'timetable',
  gradeQuery: 'grade_query',
  gpaCalculation: 'gpa_calculation',
  courseSelection: 'course_schedule',
  examSchedule: 'exam_schedule',
  login: 'login',
  busSchedule: 'bus_schedule',
  program: 'program',
  studyProgress: 'study_progress',
  electricity: 'electricity',
  payment: 'payment',
  map: 'map',
} as const

const ENABLED_FEATURES: string[] = Object.values(FEATURES)

export function supportsFeature(feature: string): boolean {
  return ENABLED_FEATURES.includes(feature)
}
