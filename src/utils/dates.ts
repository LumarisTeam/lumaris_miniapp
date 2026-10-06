import type { MessageKey } from '@/i18n'

/**
 * 日期与星期的文案键索引。
 *
 * 小程序里没法可靠地用 `Intl`（微信运行时不一定带），所以日期一律由语言包里的
 * 月份/星期短名拼出来。课表星期栏、课程详情和校车日期条共用这一份，避免各页面
 * 各写一套下标。
 */

/** 下标 = `Date.getDay()`（0 是周日）。 */
export const WEEKDAY_SHORT_KEYS: MessageKey[] = [
  'sundayShort', 'mondayShort', 'tuesdayShort', 'wednesdayShort',
  'thursdayShort', 'fridayShort', 'saturdayShort',
]

/** 下标 = `Date.getMonth()`。 */
export const MONTH_SHORT_KEYS: MessageKey[] = [
  'janShort', 'febShort', 'marShort', 'aprShort', 'mayShort', 'junShort',
  'julShort', 'augShort', 'sepShort', 'octShort', 'novShort', 'decShort',
]

/** 下标 = 课程的 weekday 字段减 1（1 是周一）。 */
export const WEEKDAY_KEYS: MessageKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

/** 课程 weekday（1~7）对应的星期文案键，越界时夹到两端。 */
export function weekdayKey(weekday: number): MessageKey {
  return WEEKDAY_KEYS[Math.min(6, Math.max(0, weekday - 1))]
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

/** 从 [start] 起连续 [count] 天的日期，用于周切换、日期条一类的「未来一周」。 */
export function dateRange(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
}

/** 本地日期转 `YYYY-MM-DD`，用作缓存 scope 与接口参数。 */
export function toDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
