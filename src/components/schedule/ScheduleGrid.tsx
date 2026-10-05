import { Text, View } from '@tarojs/components'
import { useTranslation } from '@/i18n'
import { PERIOD_COUNT, groupConflictingCourses, orderedWeekdays } from '@/utils/education'
import { ScheduleCourseCard, type CourseCardStyle } from '@/components/schedule/ScheduleCourseCard'
import { TimelineColumn } from '@/components/schedule/TimelineColumn'
import type { Course } from '@/types/domain'
import './scheduleGrid.scss'

/**
 * 课表网格：左侧时间轴 + 右侧 7 天课程。
 *
 * 对应 Flutter 的 `lib/ui/components/schedule/schedule_grid.dart`。同一时段有多门
 * 不同课程时合并成一个「冲突」块，点开再选具体课程——直接叠着画会互相盖住。
 */
export function ScheduleGrid({
  courses,
  cellHeight,
  weekStartDay,
  campus,
  cardStyle,
  showGrid,
  onCourseTap,
  onConflictTap,
}: {
  courses: Course[]
  /** 每格高度，单位 rpx */
  cellHeight: number
  weekStartDay: number
  campus: string
  cardStyle: CourseCardStyle
  showGrid: boolean
  onCourseTap: (course: Course) => void
  onConflictTap: (courses: Course[]) => void
}) {
  const t = useTranslation()
  const weekdays = orderedWeekdays(weekStartDay)
  const gridHeight = PERIOD_COUNT * cellHeight

  return (
    <View className='schedule-grid'>
      <TimelineColumn
        periodCount={PERIOD_COUNT}
        cellHeight={cellHeight}
        campus={campus}
        showGrid={showGrid}
      />

      <View className='schedule-grid__days' style={{ height: `${gridHeight}rpx` }}>
        {showGrid ? (
          <View className='schedule-grid__lines'>
            {Array.from({ length: PERIOD_COUNT * 7 }, (_, index) => (
              <View className='schedule-grid__line-cell' key={`line-${index}`} />
            ))}
          </View>
        ) : null}

        {weekdays.map((weekday) => {
          const dayCourses = courses
            .filter((course) => course.weekday === weekday)
            .sort((left, right) => left.startUnit - right.startUnit)

          return (
            <View className='schedule-grid__day' key={weekday}>
              {groupConflictingCourses(dayCourses).map((group) => {
                const first = group[0]
                const minStart = Math.min(...group.map((course) => course.startUnit))
                const maxEnd = Math.max(...group.map((course) => course.endUnit))
                const top = (minStart - 1) * cellHeight
                const height = (maxEnd - minStart + 1) * cellHeight

                return (
                  <View
                    className='schedule-grid__slot'
                    style={{ top: `${top}rpx`, height: `${height}rpx` }}
                    key={group.map((course) => course.id).join('|')}
                  >
                    {group.length === 1 ? (
                      <ScheduleCourseCard course={first} style={cardStyle} onTap={() => onCourseTap(first)} />
                    ) : (
                      <View
                        className='schedule-card schedule-card--conflict pressable'
                        style={{ backgroundColor: first.color }}
                        onClick={() => onConflictTap(group)}
                      >
                        <Text className='schedule-card__conflict'>{t('courseConflict')}</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )
        })}
      </View>
    </View>
  )
}
