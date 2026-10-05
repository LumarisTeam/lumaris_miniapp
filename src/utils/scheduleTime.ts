import type { Course, ScheduleTable } from '@/types/domain'

/**
 * 作息表（各节次上课时间）查询。
 *
 * 权威数据在服务端 `GET /v1/course/ScheduleTime`，启动与刷新时由
 * `ScheduleTimeRepository` 装载；这里始终同步读取，UI 直接调用。远端数据
 * 尚未装载或拉取失败时使用内置兜底表。
 *
 * 与 Flutter 版 `lib/core/services/time_service.dart` 的 TimeService 保持同一语义。
 */

/** 草堂校区名（与 ScheduleTable.campusName 对齐） */
export const CAOTANG_CAMPUS = '草堂校区'

/** 雁塔校区名（与 ScheduleTable.campusName 对齐） */
export const YANTA_CAMPUS = '雁塔校区'

// 与 GET /v1/course/ScheduleTime 的实际返回逐字一致（服务端不补前导零，
// 例如 "8:00"），这样兜底态和远端态的显示不会有差异。
const CAOTANG_START = ['8:00', '8:30', '9:20', '10:25', '11:15', '12:10', '13:00', '14:00', '14:50', '15:45', '16:35', '19:30', '20:20']
const CAOTANG_END = ['8:20', '9:15', '10:05', '11:10', '12:00', '12:55', '13:45', '14:45', '15:35', '16:30', '17:20', '20:15', '21:05']
const YANTA_WINTER_START = ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:00', '15:00', '16:00', '17:00', '19:30', '20:30']
const YANTA_WINTER_END = ['', '8:50', '9:50', '11:00', '12:00', '', '', '14:50', '15:50', '16:50', '17:50', '20:20', '21:20']
const YANTA_SUMMER_START = ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:30', '15:30', '16:30', '17:30', '20:00', '21:00']
const YANTA_SUMMER_END = ['', '8:50', '9:50', '11:00', '12:00', '', '', '15:20', '16:20', '17:30', '18:20', '20:50', '21:50']

/**
 * 内置兜底表，仅用于首次启动（还没有缓存）和拉取失败的情况。
 * 内容与服务端保持一致，下标 0 是早自习。
 */
export const BUILT_IN_TABLES: ScheduleTable[] = [
  { campusName: CAOTANG_CAMPUS, timeRange: '', start: CAOTANG_START, end: CAOTANG_END },
  { campusName: YANTA_CAMPUS, timeRange: '10/01~04/30', start: YANTA_WINTER_START, end: YANTA_WINTER_END },
  { campusName: YANTA_CAMPUS, timeRange: '05/01~09/30', start: YANTA_SUMMER_START, end: YANTA_SUMMER_END },
]

let tables: ScheduleTable[] = BUILT_IN_TABLES
let usingRemoteTables = false

/** 当前生效的作息表。 */
export function getTables(): ScheduleTable[] {
  return tables
}

/** 当前是否用的是服务端下发的表（false 表示还是内置兜底）。 */
export function isUsingRemoteTables(): boolean {
  return usingRemoteTables
}

/** 装载服务端下发的作息表；为空时退回内置表。 */
export function installTables(next: ScheduleTable[]): void {
  if (next.length === 0) {
    resetToBuiltInTables()
    return
  }
  tables = next
  usingRemoteTables = true
}

/** 退回内置兜底表（登出等场景）。 */
export function resetToBuiltInTables(): void {
  tables = BUILT_IN_TABLES
  usingRemoteTables = false
}

/** 把 `MM/DD~MM/DD` 解析成 `[月, 日, 月, 日]`；格式不符时返回 null。 */
export function parseRange(text: string): [number, number, number, number] | null {
  const match = /^(\d{1,2})\/(\d{1,2})\s*~\s*(\d{1,2})\/(\d{1,2})$/.exec(text.trim())
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
}

/**
 * 这张表是否适用于 date。
 * timeRange 为空、或不是 `MM/DD~MM/DD` 形式时视为全年适用。
 */
export function tableCoversDate(table: ScheduleTable, date: Date): boolean {
  const range = parseRange(table.timeRange)
  if (!range) return true

  const today = (date.getMonth() + 1) * 100 + date.getDate()
  const from = range[0] * 100 + range[1]
  const to = range[2] * 100 + range[3]
  // from > to 说明区间跨年，例如 10/01~04/30
  return from <= to ? today >= from && today <= to : today >= from || today <= to
}

/**
 * 由课程字段判定校区名（与 ScheduleTable.campusName 对齐）。
 * 教务的校区字段可能不准，教室名以「草堂」开头的也算草堂。
 */
export function resolveCampusName(course: Pick<Course, 'campus' | 'room'>): string {
  const isCaoTang = course.campus === CAOTANG_CAMPUS || course.room.startsWith('草堂')
  return isCaoTang ? CAOTANG_CAMPUS : YANTA_CAMPUS
}

function pickTable(source: ScheduleTable[], campus: string, date: Date): ScheduleTable | null {
  const candidates = source.filter((table) => table.campusName === campus)
  if (candidates.length === 0) return null
  return candidates.find((table) => tableCoversDate(table, date)) ?? candidates[0]
}

function resolveTable(campus: string, date: Date): ScheduleTable | null {
  const table = pickTable(tables, campus, date)
  if (table) return table
  // 远端数据里没有这个校区（例如服务端改了校区名）时退回内置表。
  return usingRemoteTables ? pickTable(BUILT_IN_TABLES, campus, date) : null
}

function lookup(times: string[] | undefined, index: number): string | null {
  if (!times || index < 0 || index >= times.length) return null
  return times[index]
}

export interface StartAndEnd {
  start: string
  end: string
}

/**
 * 取 campus 校区第 startUnit~endUnit 节课的起止时间。
 *
 * 节次超出该校区作息表长度、或表里没有这个校区时，退回草堂的时间；
 * 都没有则返回空串。
 */
export function getStartAndEndForCampus(
  campus: string,
  startUnit: number,
  endUnit: number,
  date: Date = new Date(),
): StartAndEnd {
  const table = resolveTable(campus, date)
  const fallback = campus === CAOTANG_CAMPUS ? null : resolveTable(CAOTANG_CAMPUS, date)
  return {
    start: lookup(table?.start, startUnit) ?? lookup(fallback?.start, startUnit) ?? '',
    end: lookup(table?.end, endUnit) ?? lookup(fallback?.end, endUnit) ?? '',
  }
}

/** 取课程对应的起止时间。date 用于选季节，默认当前时间。 */
export function getStartAndEnd(
  course: Pick<Course, 'campus' | 'room' | 'startUnit' | 'endUnit'>,
  date: Date = new Date(),
): StartAndEnd {
  return getStartAndEndForCampus(resolveCampusName(course), course.startUnit, course.endUnit, date)
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (item === null || item === undefined ? '' : String(item)))
}

/**
 * 归一化服务端返回的一项作息表，兼容 PascalCase 字段名
 * （`CampusName`/`Time`/`Start`/`End`）。
 */
export function normalizeScheduleTable(raw: Record<string, unknown>): ScheduleTable {
  const read = (key: string): unknown => {
    if (key in raw) return raw[key]
    const pascal = key.charAt(0).toUpperCase() + key.slice(1)
    return raw[pascal]
  }
  return {
    campusName: String(read('campusName') ?? ''),
    timeRange: String(read('time') ?? ''),
    start: asStringArray(read('start')),
    end: asStringArray(read('end')),
  }
}

/** 过滤出可用的作息表：必须有校区名和至少一个节次时间。 */
export function normalizeScheduleTables(raw: unknown): ScheduleTable[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map(normalizeScheduleTable)
    .filter((table) => table.campusName !== '' && (table.start.length > 0 || table.end.length > 0))
}
