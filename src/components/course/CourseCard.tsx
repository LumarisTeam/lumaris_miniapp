import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Course } from '@/types/domain'
import { getCourseTime } from '@/utils/education'
import './course.scss'

export function CourseCard({ course, compact = false }: { course: Course; compact?: boolean }) {
  const time = getCourseTime(course)
  const details = [course.location, course.teacher, time.start && time.end ? `${time.start}-${time.end}` : ''].filter(Boolean)

  return (
    <View
      className={`course-card pressable ${compact ? 'course-card--compact' : ''}`}
      style={{ borderLeftColor: course.color }}
      onClick={() => Taro.showModal({
        title: course.name,
        content: [...details, `第 ${course.startSlot}-${course.endSlot} 节`].join('\n'),
        showCancel: false,
      })}
    >
      <Text className='course-card__name'>{course.name}</Text>
      {details.map((detail) => <Text className='course-card__meta' key={detail}>{detail}</Text>)}
    </View>
  )
}
