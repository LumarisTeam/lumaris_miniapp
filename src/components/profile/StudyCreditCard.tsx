import { Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { useTranslation } from '@/i18n'
import type { StudyModule } from '@/types/domain'
import './studyCreditCard.scss'

/**
 * 学习进度卡片：模块标题 + 总学分进度 + 分项学分列表。
 *
 * 对应 Flutter 的 `lib/ui/components/study_credit_card.dart`。数据来自
 * `GET /Info/Completion`（每个模块一张卡）。
 */

/** 完成度对应的颜色分档，与 Flutter 的 _getProgressColor 一致。 */
function progressTone(progress: number): string {
  if (progress >= 1) return 'success'
  if (progress >= 0.8) return 'primary'
  if (progress >= 0.5) return 'warning'
  return 'danger'
}

function ratio(actual: number, full: number): number {
  return full > 0 ? actual / full : 0
}

function formatValue(value: number): string {
  return Number(value || 0).toFixed(1)
}

function ProgressBar({ tone, progress }: { tone: string; progress: number }) {
  const width = Math.min(1, Math.max(0, progress)) * 100
  return (
    <View className='credit-bar'>
      <View className={`credit-bar__fill credit-bar__fill--${tone}`} style={{ width: `${width}%` }} />
    </View>
  )
}

function CreditRow({ name, actual, full }: { name: string; actual: number; full: number }) {
  const tone = progressTone(ratio(actual, full))
  return (
    <View className='credit-item'>
      <View className='credit-item__head'>
        <Text className='credit-item__name'>{name}</Text>
        <Text className={`credit-item__value credit-item__value--${tone}`}>
          {formatValue(actual)} / {formatValue(full)}
        </Text>
      </View>
      <ProgressBar tone={tone} progress={ratio(actual, full)} />
    </View>
  )
}

export function StudyCreditCard({ data }: { data: StudyModule }) {
  const t = useTranslation()
  const totalProgress = ratio(data.total.actual, data.total.full)
  const tone = progressTone(totalProgress)

  return (
    <View className='credit-card'>
      <ClubCard>
        <View className='credit-card__header'>
          <View className='credit-card__badge'>
            <AppIcon name='book' size={28} color='var(--primary)' />
          </View>
          <View className='grow'>
            <Text className='credit-card__title'>{data.type}</Text>
            <Text className='credit-card__subtitle'>{t('creditOverview')}</Text>
          </View>
        </View>

        <View className='credit-card__total'>
          <View className='credit-card__total-head'>
            <View className='credit-card__indicator' />
            <Text className='credit-card__total-name'>{data.total.name}</Text>
            <Text className={`credit-card__total-value credit-item__value--${tone}`}>
              {formatValue(data.total.actual)} / {formatValue(data.total.full)}
            </Text>
          </View>
          <ProgressBar tone={tone} progress={totalProgress} />
          <Text className='credit-card__rate'>
            {t('completionRate')}: {(totalProgress * 100).toFixed(1)}%
          </Text>
        </View>

        {data.other.length > 0 ? (
          <View className='credit-card__items'>
            <View className='credit-card__items-head'>
              <View className='credit-card__indicator' />
              <Text className='credit-card__items-title'>{t('itemizedCredits')}</Text>
            </View>
            {data.other.map((item) => (
              <CreditRow key={item.name} name={item.name} actual={item.actual} full={item.full} />
            ))}
          </View>
        ) : null}
      </ClubCard>
    </View>
  )
}
