import { Text, View } from '@tarojs/components'
import { Popup } from '@nutui/nutui-react-taro'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import { useTranslation, type MessageKey } from '@/i18n'
import { formatWeekRanges } from '@/utils/education'
import type { Course } from '@/types/domain'
import './courseDetailSheet.scss'

/**
 * 课程详情弹层：课程名 + 地点/教师/时间/校区/学分。
 *
 * 对应 Flutter 的 `lib/ui/components/schedule/course_detail_sheet.dart`。
 */

/** Course.weekday 是 1(周一)~7(周日)。 */
const WEEKDAY_KEYS: MessageKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function weekdayKey(weekday: number): MessageKey {
  return WEEKDAY_KEYS[Math.min(6, Math.max(0, weekday - 1))]
}

/** 图标集有限（NutUI），这里挑语义最近的，含义由左侧标签承担。 */
interface InfoRow {
  icon: IconName
  tone: string
  label: MessageKey
  content: string
}

export function CourseDetailSheet({
  course,
  visible,
  onClose,
}: {
  course: Course | null
  visible: boolean
  onClose: () => void
}) {
  const t = useTranslation()
  if (!course) return null

  const rows: InfoRow[] = [
    { icon: 'location', tone: 'primary', label: 'classroom', content: course.room },
    {
      icon: course.teachers.length > 1 ? 'people' : 'user',
      tone: 'danger',
      label: 'teacherLabel',
      content: course.teachers.join(', '),
    },
    {
      icon: 'calendar',
      tone: 'success',
      label: 'classTime',
      content: t('scheduleCourseTime', {
        weekRanges: formatWeekRanges(course.weekIndexes),
        weekday: t(weekdayKey(course.weekday)),
        start: course.startUnit,
        end: course.endUnit,
      }),
    },
  ]

  if (course.campus) {
    rows.push({ icon: 'home', tone: 'warning', label: 'classCampus', content: course.campus })
  }
  if (course.credits) {
    rows.push({ icon: 'book', tone: 'yellow', label: 'courseCredits', content: course.credits })
  }

  return (
    <Popup visible={visible} position='bottom' round onClose={onClose}>
      <View className='course-sheet'>
        <Text className='course-sheet__title'>{course.courseName}</Text>
        <View className='course-sheet__rows'>
          {rows.map((row) => (
            <View className='course-sheet__row' key={row.label}>
              <View className={`course-sheet__badge course-sheet__badge--${row.tone}`}>
                <AppIcon name={row.icon} size={20} color={`var(--sheet-accent-${row.tone})`} />
              </View>
              <View className='course-sheet__body'>
                <Text className='course-sheet__label'>{t(row.label)}</Text>
                <Text className='course-sheet__content'>{row.content || '—'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Popup>
  )
}
