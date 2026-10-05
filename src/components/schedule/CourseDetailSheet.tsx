import { DetailSheet, type DetailRow } from '@/components/common/DetailSheet'
import { useTranslation, type MessageKey } from '@/i18n'
import { formatWeekRanges } from '@/utils/education'
import type { Course } from '@/types/domain'

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

  const rows: DetailRow[] = [
    { icon: 'location', tone: 'primary', label: t('classroom'), content: course.room },
    {
      icon: course.teachers.length > 1 ? 'people' : 'user',
      tone: 'danger',
      label: t('teacherLabel'),
      content: course.teachers.join(', '),
    },
    {
      icon: 'calendar',
      tone: 'success',
      label: t('classTime'),
      content: t('scheduleCourseTime', {
        weekRanges: formatWeekRanges(course.weekIndexes),
        weekday: t(weekdayKey(course.weekday)),
        start: course.startUnit,
        end: course.endUnit,
      }),
    },
  ]

  if (course.campus) {
    rows.push({ icon: 'home', tone: 'warning', label: t('classCampus'), content: course.campus })
  }
  if (course.credits) {
    rows.push({ icon: 'book', tone: 'yellow', label: t('courseCredits'), content: course.credits })
  }

  return <DetailSheet title={course.courseName} rows={rows} visible={visible} onClose={onClose} />
}
