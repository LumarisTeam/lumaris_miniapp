import { Text, View } from '@tarojs/components'
import { useTranslation } from '@/i18n'
import { MONTH_SHORT_KEYS, WEEKDAY_SHORT_KEYS, isSameDay } from '@/utils/dates'
import './scheduleGrid.scss'

/**
 * 课表顶部的星期栏：星期简称 + 日期，今天高亮。
 *
 * 对应 Flutter 的 `lib/ui/components/schedule/weekday_header.dart`。列顺序就是从
 * weekStartDate 起的连续 7 天，所以周起始日由调用方传入的日期决定。
 */

export function WeekdayHeader({
  weekStartDate,
  showDate,
  showGrid,
  highlightToday,
}: {
  weekStartDate: Date
  showDate: boolean
  showGrid: boolean
  highlightToday: boolean
}) {
  const t = useTranslation()
  const now = new Date()

  return (
    <View className={`weekday-header ${showDate ? 'weekday-header--dated' : ''}`}>
      <View className={`weekday-header__corner ${showGrid ? 'weekday-header__corner--grid' : ''}`}>
        {showDate ? <Text className='weekday-header__month'>{t(MONTH_SHORT_KEYS[weekStartDate.getMonth()])}</Text> : null}
      </View>

      {Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + index)
        const isToday = highlightToday && isSameDay(date, now)
        const weekdayKey = WEEKDAY_SHORT_KEYS[date.getDay()]

        return (
          <View
            className={`weekday-header__day ${showGrid ? 'weekday-header__day--grid' : ''}`}
            key={index}
          >
            <Text className={`weekday-header__name ${isToday ? 'weekday-header__name--today' : ''}`}>
              {t(weekdayKey)}
            </Text>
            {showDate ? (
              <View className={`weekday-header__date ${isToday ? 'weekday-header__date--today' : ''}`}>
                <Text className={`weekday-header__day-number ${isToday ? 'weekday-header__day-number--today' : ''}`}>
                  {date.getDate()}
                </Text>
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
