import { fetchScheduleTime } from '@/api/education'
import type { ScheduleTable } from '@/types/domain'
import { CacheTtl } from '@/utils/cachePolicy'
import { installTables, normalizeScheduleTables, resetToBuiltInTables } from '@/utils/scheduleTime'
import { readCache, STORAGE_KEYS, writeCache } from '@/utils/storage'

/**
 * 作息表取数：权威数据在服务端 `GET /v1/course/ScheduleTime`，本地只做缓存。
 *
 * 启动先用缓存装载，登录/手动刷新时再拉一次远端。任何一步失败都保留当前
 * 生效的表——远端缓存或内置兜底表——不会让课表时间变空。与 Flutter 的
 * `lib/features/education/services/schedule_time_service.dart` 语义一致。
 */

/** 作息表极少变动，给一天的超长期缓存。 */
const SCHEDULE_TIME_TTL = CacheTtl.veryLongTerm

export function scheduleTimeScope(schoolCode: string): string {
  return schoolCode.trim().toUpperCase()
}

function isScheduleTableArray(value: unknown): value is ScheduleTable[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Boolean(item && typeof item === 'object') &&
        typeof (item as ScheduleTable).campusName === 'string' &&
        Array.isArray((item as ScheduleTable).start) &&
        Array.isArray((item as ScheduleTable).end),
    )
  )
}

function readCachedTables(schoolCode: string): ScheduleTable[] | null {
  const entry = readCache(STORAGE_KEYS.SCHEDULE_TIME, scheduleTimeScope(schoolCode), isScheduleTableArray)
  if (!entry) return null
  const tables = normalizeScheduleTables(entry.data)
  return tables.length > 0 ? tables : null
}

/**
 * 用本地缓存装载作息表（同步，供启动流程使用）。
 *
 * 没有缓存或解析失败时保持当前表（首次启动即内置兜底表），返回是否装载成功。
 */
export function loadScheduleTimeFromCache(schoolCode: string): boolean {
  const tables = readCachedTables(schoolCode)
  if (!tables) return false
  installTables(tables)
  return true
}

/**
 * 拉取远端作息表并写入缓存，返回是否成功装载。
 *
 * 失败只返回 false，不抛异常——调用方不需要处理，当前生效的表保持不变。
 */
export async function fetchScheduleTimeFromRemote(
  schoolCode: string,
  forceRefresh = false,
): Promise<boolean> {
  if (!forceRefresh) {
    const cached = readCachedTables(schoolCode)
    if (cached) {
      installTables(cached)
      return true
    }
  }

  try {
    const tables = normalizeScheduleTables(await fetchScheduleTime())
    if (tables.length === 0) {
      // 服务端返回空数组时保持当前表，避免把可用的缓存冲掉。
      return false
    }
    writeCache(STORAGE_KEYS.SCHEDULE_TIME, tables, scheduleTimeScope(schoolCode), SCHEDULE_TIME_TTL)
    installTables(tables)
    return true
  } catch {
    return false
  }
}

/** 确保作息表已装载：已用远端表则直接返回，否则先读缓存。 */
export function ensureScheduleTimeLoaded(schoolCode: string): void {
  if (loadScheduleTimeFromCache(schoolCode)) return
  resetToBuiltInTables()
}
