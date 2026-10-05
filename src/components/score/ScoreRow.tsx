import { Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { useTranslation } from '@/i18n'
import { colorForName } from '@/utils/education'
import type { Score } from '@/types/domain'
import './score.scss'

/**
 * 成绩列表的一行：一行一张卡，卡内是课程色竖条 + 课程名（辅修会标注）+
 * 学分/成绩/绩点。
 *
 * 对应 Flutter `score_page.dart` 的 `_buildScoreSliverList` + `_buildScoreItem`：
 * 固定行高 72dp，卡片圆角用 navigation 档，行间距 8dp。
 */
export function ScoreRow({ score, canGpa, onTap }: { score: Score; canGpa: boolean; onTap: () => void }) {
  const t = useTranslation()

  // 图标沿用 Flutter 的三个（time / location / star），在现有图标集里挑最接近的。
  const meta: Array<{ icon: 'clock' | 'location' | 'success'; text: string }> = [
    { icon: 'clock', text: t('creditUnit', { credit: score.credit }) },
    { icon: 'location', text: t('gradeLabel', { grade: score.grade }) },
  ]
  if (canGpa) meta.push({ icon: 'success', text: t('gpaLabel', { gpa: score.gpa }) })

  return (
    <ClubCard padding='none' radius='navigation' onClick={onTap}>
      <View className='score-row'>
        <View className='score-row__bar' style={{ backgroundColor: colorForName(score.name) }} />
        <View className='score-row__body'>
          <Text className='score-row__name'>
            {score.name}
            {score.isMinor ? ` (${t('minorCourse')})` : ''}
          </Text>
          <View className='score-row__meta'>
            {meta.map((item) => (
              <View className='score-row__meta-item' key={item.text}>
                <AppIcon name={item.icon} size={16} color='var(--secondary-label)' />
                <Text className='score-row__meta-text'>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ClubCard>
  )
}
