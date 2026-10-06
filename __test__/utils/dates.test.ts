import { MONTH_SHORT_KEYS, WEEKDAY_KEYS, WEEKDAY_SHORT_KEYS, dateRange, isSameDay, toDateKey, weekdayKey } from '@/utils/dates'

describe('date helpers', () => {
  test('indexes weekday and month keys the way Date does', () => {
    // Date.getDay(): 0 是周日；课程的 weekday 字段：1 是周一。
    expect(WEEKDAY_SHORT_KEYS).toHaveLength(7)
    expect(MONTH_SHORT_KEYS).toHaveLength(12)
    expect(WEEKDAY_KEYS).toHaveLength(7)
    expect(weekdayKey(1)).toBe('monday')
    expect(weekdayKey(7)).toBe('sunday')
    expect(weekdayKey(0)).toBe('monday')
    expect(weekdayKey(9)).toBe('sunday')
  })

  test('builds consecutive local dates without drifting across month ends', () => {
    const days = dateRange(new Date(2026, 4, 30), 3)
    expect(days.map((date) => date.getDate())).toEqual([30, 31, 1])
    expect(days.map((date) => date.getMonth())).toEqual([4, 4, 5])
  })

  test('formats a local date key and compares days', () => {
    expect(toDateKey(new Date(2026, 8, 1))).toBe('2026-09-01')
    expect(isSameDay(new Date(2026, 8, 1, 8), new Date(2026, 8, 1, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 8, 1), new Date(2026, 8, 2))).toBe(false)
  })
})
