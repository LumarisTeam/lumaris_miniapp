import { fetchCourses, fetchTimeInfo } from '@/api/education'
import type { Course, FetchPolicy, FetchSnapshot, TimeInfo } from '@/types/domain'
import { assignCourseColors, normalizeCourse, normalizeTimeInfo } from '@/utils/education'
import { fetchScheduleTimeFromRemote } from '@/services/scheduleTimeRepository'
import { CacheTtl } from '@/utils/cachePolicy'
import { readCache, STORAGE_KEYS, writeCache } from '@/utils/storage'

const COURSE_TTL = CacheTtl.mediumTerm
const TIME_TTL = CacheTtl.shortTerm

export interface CourseBundle {
  courses: Course[]
  timeInfo: TimeInfo | null
}

export type CourseBundleSnapshot = FetchSnapshot<CourseBundle> & { coursesRefreshed: boolean }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord)
}

function courseScope(studentId: string, schoolCode: string): string {
  return `${schoolCode.toUpperCase()}:${studentId}`
}

export function readCourseBundle(studentId: string, schoolCode: string): CourseBundleSnapshot {
  const coursesEntry = readCache(STORAGE_KEYS.COURSES, courseScope(studentId, schoolCode), isRecordArray)
  const timeEntry = readCache(STORAGE_KEYS.TIME_INFO, schoolCode.toUpperCase(), isRecord)
  const courses = coursesEntry ? assignCourseColors(coursesEntry.data.map(normalizeCourse)) : []
  const timeInfo = timeEntry ? normalizeTimeInfo(timeEntry.data) : null
  const entries = [coursesEntry, timeEntry].filter(Boolean)
  return {
    data: { courses, timeInfo },
    isFromLocal: true,
    isStale: entries.length > 0 && entries.some((entry) => entry!.expiresAt <= Date.now()),
    coursesRefreshed: false,
  }
}

async function refreshCourseBundle(studentId: string, schoolCode: string): Promise<CourseBundleSnapshot> {
  const fallback = readCourseBundle(studentId, schoolCode)
  const [coursesResult, timeResult] = await Promise.allSettled([
    fetchCourses(studentId),
    fetchTimeInfo(),
    // 作息表是学校级数据，刷新课表时顺手更新；带 24h 缓存，命中时不发请求。
    fetchScheduleTimeFromRemote(schoolCode),
  ])
  let courses = fallback.data.courses
  let timeInfo = fallback.data.timeInfo
  let fetchedAny = false

  if (coursesResult.status === 'fulfilled') {
    courses = assignCourseColors(coursesResult.value)
    writeCache(STORAGE_KEYS.COURSES, courses, courseScope(studentId, schoolCode), COURSE_TTL)
    fetchedAny = true
  }
  if (timeResult.status === 'fulfilled') {
    timeInfo = timeResult.value
    writeCache(STORAGE_KEYS.TIME_INFO, timeInfo, schoolCode.toUpperCase(), TIME_TTL)
    fetchedAny = true
  }

  if (!fetchedAny && courses.length === 0 && !timeInfo) {
    const reason = coursesResult.status === 'rejected' ? coursesResult.reason : timeResult.status === 'rejected' ? timeResult.reason : null
    throw reason instanceof Error ? reason : new Error('课表加载失败')
  }
  return {
    data: { courses, timeInfo },
    isFromLocal: !fetchedAny,
    isStale: (coursesResult.status === 'rejected' && courses.length > 0) || (timeResult.status === 'rejected' && Boolean(timeInfo)),
    coursesRefreshed: coursesResult.status === 'fulfilled',
  }
}

export async function getCourseBundle(
  studentId: string,
  schoolCode: string,
  policy: FetchPolicy = 'local-first',
): Promise<CourseBundleSnapshot> {
  const local = readCourseBundle(studentId, schoolCode)
  if (policy === 'local-first' && (local.data.courses.length > 0 || local.data.timeInfo)) return local
  return refreshCourseBundle(studentId, schoolCode)
}
