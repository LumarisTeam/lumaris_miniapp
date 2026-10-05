import { Text, View } from '@tarojs/components'
import type { Course } from '@/types/domain'
import './scheduleGrid.scss'

/**
 * 课表格子里的课程块。
 *
 * 对应 Flutter 的 `lib/ui/components/schedule/course_card.dart`：整块课程色底 +
 * 白色文字，紧凑/标准/宽松三档控制字号。
 */

export type CourseCardStyle = 'small' | 'normal' | 'large'

/**
 * 三档课表尺寸：值对应 Flutter 的 course_size（50 / 55 / 60 逻辑像素）。
 * 课表页的样式切换与课表设置页共用这一份定义。
 */
export const COURSE_CARD_STYLES: Array<{
  value: CourseCardStyle
  size: number
  labelKey: 'compact' | 'standard' | 'relaxed'
}> = [
  { value: 'small', size: 50, labelKey: 'compact' },
  { value: 'normal', size: 55, labelKey: 'standard' },
  { value: 'large', size: 60, labelKey: 'relaxed' },
]

export function courseCardStyleForSize(size: number) {
  return COURSE_CARD_STYLES.find((item) => item.size === size) ?? COURSE_CARD_STYLES[1]
}

/** 与 Flutter 的 _getFontSizeAdd 一致。 */
const FONT_DELTA: Record<CourseCardStyle, number> = {
  small: 0.4,
  normal: 0.9,
  large: 1.3,
}

/** 基础字号（逻辑像素），与 Flutter 手机端取值一致。 */
const BASE_NAME = 10
const BASE_ROOM = 9
const BASE_TEACHER = 8

export function courseCardFontSizes(style: CourseCardStyle): { name: number; room: number; teacher: number } {
  const delta = FONT_DELTA[style]
  return { name: BASE_NAME + delta, room: BASE_ROOM + delta, teacher: BASE_TEACHER + delta }
}

export function ScheduleCourseCard({
  course,
  style,
  onTap,
}: {
  course: Course
  style: CourseCardStyle
  onTap: () => void
}) {
  const sizes = courseCardFontSizes(style)

  return (
    <View
      className={`schedule-card schedule-card--${style} pressable`}
      style={{ backgroundColor: course.color }}
      onClick={onTap}
    >
      <Text className='schedule-card__name' style={{ fontSize: `${sizes.name * 2}rpx` }}>
        {course.courseName}
      </Text>
      {course.room ? (
        <Text className='schedule-card__meta' style={{ fontSize: `${sizes.room * 2}rpx` }}>{course.room}</Text>
      ) : null}
      {course.teachers.length > 0 ? (
        <Text className='schedule-card__meta' style={{ fontSize: `${sizes.teacher * 2}rpx` }}>
          {course.teachers.join(', ')}
        </Text>
      ) : null}
    </View>
  )
}
