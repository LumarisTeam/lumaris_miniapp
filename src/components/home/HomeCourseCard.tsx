import { Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { useTranslation } from '@/i18n'
import { getCourseTime } from '@/utils/education'
import type { Course } from '@/types/domain'
import './homeCourseCard.scss'

/**
 * 首页今日课表里的单条课程。
 *
 * 对应 Flutter `schedule_widget.dart` 的 `_buildScheduleItem`：左侧一条课程色
 * 竖条，右侧是课程名 + 「节次 时间」+ 地点。
 */
export function HomeCourseCard({ course, onTap }: { course: Course; onTap: () => void }) {
  const t = useTranslation()
  const time = getCourseTime(course)
  const timeRange = time.start && time.end ? `${time.start}-${time.end}` : ''

  return (
    <View className='home-course pressable' onClick={onTap}>
      <View className='home-course__bar' style={{ backgroundColor: course.color }} />
      <View className='home-course__body'>
        <Text className='home-course__name'>{course.courseName}</Text>
        <View className='home-course__meta'>
          <AppIcon name='clock' size={18} color='var(--secondary-label)' />
          <Text className='home-course__meta-text'>
            {t('periodRange', { start: course.startUnit, end: course.endUnit })}
            {timeRange ? ` ${timeRange}` : ''}
          </Text>
        </View>
        <View className='home-course__meta'>
          <AppIcon name='location' size={18} color='var(--secondary-label)' />
          <Text className='home-course__meta-text'>{course.room || '—'}</Text>
        </View>
      </View>
    </View>
  )
}
