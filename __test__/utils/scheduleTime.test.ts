import {
  BUILT_IN_TABLES,
  CAOTANG_CAMPUS,
  YANTA_CAMPUS,
  getStartAndEnd,
  getStartAndEndForCampus,
  installTables,
  isUsingRemoteTables,
  normalizeScheduleTables,
  parseRange,
  resolveCampusName,
  tableCoversDate,
  resetToBuiltInTables,
} from '@/utils/scheduleTime'
import type { ScheduleTable } from '@/types/domain'

const remoteTable = (campusName: string, timeRange: string, start: string[], end: string[]): ScheduleTable => ({
  campusName,
  timeRange,
  start,
  end,
})

describe('schedule table helpers', () => {
  afterEach(() => resetToBuiltInTables())

  test('parses MM/DD~MM/DD ranges and rejects malformed input', () => {
    expect(parseRange('05/01~09/30')).toEqual([5, 1, 9, 30])
    expect(parseRange(' 10/01 ~ 04/30 ')).toEqual([10, 1, 4, 30])
    expect(parseRange('')).toBeNull()
    expect(parseRange('夏季')).toBeNull()
    expect(parseRange('2026-05-01~2026-09-30')).toBeNull()
  })

  test('matches dates inside a range and across a year boundary', () => {
    const summer = remoteTable(YANTA_CAMPUS, '05/01~09/30', [], [])
    expect(tableCoversDate(summer, new Date('2026-06-15'))).toBe(true)
    expect(tableCoversDate(summer, new Date('2026-09-30'))).toBe(true)
    expect(tableCoversDate(summer, new Date('2026-10-01'))).toBe(false)

    const winter = remoteTable(YANTA_CAMPUS, '10/01~04/30', [], [])
    expect(tableCoversDate(winter, new Date('2026-12-01'))).toBe(true)
    expect(tableCoversDate(winter, new Date('2026-01-15'))).toBe(true)
    expect(tableCoversDate(winter, new Date('2026-05-01'))).toBe(false)
  })

  test('treats an empty or unparsable range as covering the whole year', () => {
    expect(tableCoversDate(remoteTable(YANTA_CAMPUS, '', [], []), new Date('2026-07-01'))).toBe(true)
    expect(tableCoversDate(remoteTable(YANTA_CAMPUS, '全年', [], []), new Date('2026-07-01'))).toBe(true)
  })

  test('resolves campus from the campus field or a 草堂 room prefix', () => {
    expect(resolveCampusName({ campus: CAOTANG_CAMPUS, room: '101' })).toBe(CAOTANG_CAMPUS)
    expect(resolveCampusName({ campus: '', room: '草堂学府城 101' })).toBe(CAOTANG_CAMPUS)
    expect(resolveCampusName({ campus: YANTA_CAMPUS, room: '大楼 101' })).toBe(YANTA_CAMPUS)
    expect(resolveCampusName({ campus: '', room: '' })).toBe(YANTA_CAMPUS)
  })

  test('picks the seasonal Yanta table by date and keeps Caotang year-round', () => {
    const winter = getStartAndEndForCampus(YANTA_CAMPUS, 1, 2, new Date('2026-01-05T08:00:00'))
    expect(winter).toEqual({ start: '8:00', end: '9:50' })

    const summer = getStartAndEndForCampus(YANTA_CAMPUS, 7, 8, new Date('2026-06-05T08:00:00'))
    expect(summer).toEqual({ start: '14:30', end: '16:20' })

    const caotang = getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 2, new Date('2026-06-05T08:00:00'))
    expect(caotang).toEqual({ start: '8:30', end: '10:05' })
  })

  test('keeps an empty slot empty instead of borrowing the other campus', () => {
    // 雁塔第 6 节在表里就是空串（没课），不应退回草堂的时间。
    expect(getStartAndEndForCampus(YANTA_CAMPUS, 6, 6, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '', end: '' })
  })

  test('returns empty times for out-of-range periods', () => {
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 99, 99, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '', end: '' })
  })

  test('prefers remote tables once installed and keeps built-ins as backup', () => {
    expect(isUsingRemoteTables()).toBe(false)

    installTables([remoteTable(CAOTANG_CAMPUS, '', ['07:00', '07:30'], ['07:45', '08:15'])])
    expect(isUsingRemoteTables()).toBe(true)
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '07:30', end: '08:15' })

    // 远端表里没有雁塔，按 Flutter 语义退回内置表。
    expect(getStartAndEndForCampus(YANTA_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '8:00', end: '8:50' })

    installTables([])
    expect(isUsingRemoteTables()).toBe(false)
    expect(getStartAndEndForCampus(CAOTANG_CAMPUS, 1, 1, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '8:30', end: '9:15' })
  })

  test('borrows the Caotang time only when the period is out of range', () => {
    installTables([
      remoteTable(CAOTANG_CAMPUS, '', ['08:00', '08:30', '09:20', '10:25'], ['08:20', '09:15', '10:05', '11:10']),
      remoteTable(YANTA_CAMPUS, '', ['09:00'], ['09:45']),
    ])

    // 雁塔表只到第 0 节，第 2 节越界 → 退回草堂。
    expect(getStartAndEndForCampus(YANTA_CAMPUS, 2, 2, new Date('2026-01-05T08:00:00')))
      .toEqual({ start: '09:20', end: '10:05' })
  })

  test('reads course times through the installed table', () => {
    const course = { campus: CAOTANG_CAMPUS, room: '101', startUnit: 1, endUnit: 2 }
    expect(getStartAndEnd(course, new Date('2026-01-05T08:00:00'))).toEqual({ start: '8:30', end: '10:05' })
  })

  test('normalizes PascalCase and camelCase payloads, dropping unusable rows', () => {
    const tables = normalizeScheduleTables([
      { CampusName: CAOTANG_CAMPUS, Time: '', Start: ['08:00'], End: ['08:45'] },
      { campusName: YANTA_CAMPUS, time: '05/01~09/30', start: ['09:00'], end: [] },
      { campusName: '', start: ['09:00'], end: ['10:00'] },
      { campusName: YANTA_CAMPUS, start: [], end: [] },
      null,
      'not-an-object',
    ])

    expect(tables).toEqual([
      { campusName: CAOTANG_CAMPUS, timeRange: '', start: ['08:00'], end: ['08:45'] },
      { campusName: YANTA_CAMPUS, timeRange: '05/01~09/30', start: ['09:00'], end: [] },
    ])
  })

  test('returns an empty list for non-array payloads', () => {
    expect(normalizeScheduleTables(null)).toEqual([])
    expect(normalizeScheduleTables({ start: ['08:00'] })).toEqual([])
  })

  test('built-in fallback matches the live ScheduleTime payload verbatim', () => {
    // 取自 2026-10-05 对 https://xauatapi.xauat.site/v1/course/ScheduleTime 的实际
    // 响应。内置兜底必须逐字一致，否则离线态和在线态会显示不同的时间格式。
    const live = [
      { campusName: '草堂校区', time: '', start: ['8:00', '8:30', '9:20', '10:25', '11:15', '12:10', '13:00', '14:00', '14:50', '15:45', '16:35', '19:30', '20:20'], end: ['8:20', '9:15', '10:05', '11:10', '12:00', '12:55', '13:45', '14:45', '15:35', '16:30', '17:20', '20:15', '21:05'] },
      { campusName: '雁塔校区', time: '10/01~04/30', start: ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:00', '15:00', '16:00', '17:00', '19:30', '20:30'], end: ['', '8:50', '9:50', '11:00', '12:00', '', '', '14:50', '15:50', '16:50', '17:50', '20:20', '21:20'] },
      { campusName: '雁塔校区', time: '05/01~09/30', start: ['', '8:00', '9:00', '10:10', '11:10', '', '', '14:30', '15:30', '16:30', '17:30', '20:00', '21:00'], end: ['', '8:50', '9:50', '11:00', '12:00', '', '', '15:20', '16:20', '17:30', '18:20', '20:50', '21:50'] },
    ]

    const normalized = normalizeScheduleTables(live)
    // 服务端字段名是 time，内部模型叫 timeRange。
    expect(normalized).toEqual(
      live.map(({ campusName, time, start, end }) => ({ campusName, timeRange: time, start, end })),
    )
    expect(BUILT_IN_TABLES).toEqual(normalized)
  })

  test('exposes Caotang and Yanta built-in tables', () => {
    expect(BUILT_IN_TABLES.map((table) => table.campusName))
      .toEqual([CAOTANG_CAMPUS, YANTA_CAMPUS, YANTA_CAMPUS])
  })
})
