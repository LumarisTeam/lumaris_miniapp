const PREFIX = 'lm_'

function key(name: string): string {
  return PREFIX + name
}

export function getStorage<T>(name: string): T | null {
  try {
    const value = uni.getStorageSync(key(name))
    return value as T
  } catch {
    return null
  }
}

/** Safely retrieve an array from storage. Returns [] if the stored value is missing or not an array. */
export function getStorageArray<T>(name: string): T[] {
  const val = getStorage<T[]>(name)
  return Array.isArray(val) ? val : []
}

export function setStorage(name: string, value: unknown): void {
  try {
    uni.setStorageSync(key(name), value)
  } catch (e) {
    console.error('Storage set error:', e)
  }
}

export function removeStorage(name: string): void {
  try {
    uni.removeStorageSync(key(name))
  } catch (e) {
    console.error('Storage remove error:', e)
  }
}

export function clearAll(): void {
  try {
    const { keys } = uni.getStorageInfoSync()
    keys
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => uni.removeStorageSync(k))
  } catch (e) {
    console.error('Storage clear error:', e)
  }
}

export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  COURSE_DATA: 'courseData',
  GUEST_COURSE_DATA: 'guestCourseData',
  CUSTOM_COURSES: 'customCourses',
  IGNORED_COURSES: 'ignoredCourses',
  SETTINGS: 'settings',
  TILE_CONFIGS: 'tileConfigs',
  SCHOOL_CONFIG: 'schoolConfig',
  CREDENTIALS: 'credentials',
  ELECTRICITY_URL: 'electricityUrl',
  ELECTRICITY_SUBSCRIPTION_EMAIL: 'electricitySubscriptionEmail',
}
