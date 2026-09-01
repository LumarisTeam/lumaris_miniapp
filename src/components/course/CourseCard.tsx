import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Course } from '@/types/domain'
import { formatWeekRanges, getCourseTime } from '@/utils/education'
import './course.scss'

export function CourseCard({ course, compact = false }: { course: Course; compact?: boolean }) {
  const time = getCourseTime(course)
  const details = [course.room, course.teachers.join('、'), time.start && time.end ? `${time.start}-${time.end}` : ''].filter(Boolean)

  return (
    <View
      className={`course-card pressable ${compact ? 'course-card--compact' : ''}`}
      style={{ borderLeftColor: course.color }}
      onClick={() => Taro.showModal({
        title: course.courseName,
        content: [...details, `第 ${course.startUnit}-${course.endUnit} 节`, course.weekIndexes.length ? `第 ${formatWeekRanges(course.weekIndexes)} 周` : ''].filter(Boolean).join('\n'),
        showCancel: false,
      })}
    >
      <Text className='course-card__name'>{course.courseName}</Text>
      {details.map((detail) => <Text className='course-card__meta' key={detail}>{detail}</Text>)}
    </View>
  )
}
