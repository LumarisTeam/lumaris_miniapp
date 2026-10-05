import { DetailSheet, type DetailRow } from '@/components/common/DetailSheet'
import { useTranslation } from '@/i18n'
import type { Score } from '@/types/domain'

/**
 * 成绩详情弹层：课程名 + 学分/成绩/绩点/成绩详情。
 *
 * 对应 Flutter `score_page.dart` 的 `_buildScoreDetailsContent`。
 */
export function ScoreDetailSheet({
  score,
  canGpa,
  visible,
  onClose,
}: {
  score: Score | null
  canGpa: boolean
  visible: boolean
  onClose: () => void
}) {
  const t = useTranslation()
  if (!score) return null

  const rows: DetailRow[] = [
    { icon: 'book', tone: 'yellow', label: t('courseCreditLabel'), content: t('creditUnit', { credit: score.credit }) },
    { icon: 'list', tone: 'danger', label: t('courseScoreLabel'), content: score.grade },
  ]

  if (canGpa) {
    rows.push({ icon: 'success', tone: 'success', label: t('courseGpaLabel'), content: score.gpa })
  }
  rows.push({ icon: 'notice', tone: 'primary', label: t('scoreDetail'), content: score.gradeDetail })

  return (
    <DetailSheet
      title={score.name}
      subtitle={score.isMinor ? t('minorCourse') : undefined}
      rows={rows}
      visible={visible}
      onClose={onClose}
    />
  )
}
