import { Text, View } from '@tarojs/components'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { useTranslation } from '@/i18n'
import type { ScoreSummary } from '@/utils/education'
import './score.scss'

/**
 * 成绩统计卡：GPA / 通过课程 / 总学分。
 *
 * 对应 Flutter `score_page.dart` 的 `_buildStatsPadding`。总学分带一个说明入口，
 * 因为这里的学分是按成绩算出来的，和教务系统口径不同。
 */
function StatItem({
  icon,
  value,
  label,
  withInfo = false,
  onInfo,
}: {
  icon: IconName
  value: string
  label: string
  withInfo?: boolean
  onInfo?: () => void
}) {
  return (
    <View className='score-stat' onClick={withInfo ? onInfo : undefined}>
      <AppIcon name={icon} size={32} color='var(--primary)' />
      <Text className='score-stat__value'>{value}</Text>
      <View className='score-stat__label-row'>
        {withInfo ? <AppIcon name='tips' size={16} color='var(--secondary-label)' /> : null}
        <Text className='score-stat__label'>{label}</Text>
      </View>
    </View>
  )
}

export function ScoreStatsCard({
  summary,
  canGpa,
  onShowCreditInfo,
}: {
  summary: ScoreSummary
  canGpa: boolean
  onShowCreditInfo: () => void
}) {
  const t = useTranslation()

  return (
    <ClubCard padding='none'>
      <View className='score-stats'>
        {canGpa ? (
          <StatItem icon='success' value={summary.weightedGpa.toFixed(2)} label='GPA' />
        ) : null}
        <StatItem icon='book' value={String(summary.courses)} label={t('passedCourses')} />
        <StatItem
          icon='category'
          value={summary.credits.toFixed(1)}
          label={t('totalCredits')}
          withInfo
          onInfo={onShowCreditInfo}
        />
      </View>
    </ClubCard>
  )
}
