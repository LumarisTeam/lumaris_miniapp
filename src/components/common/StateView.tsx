import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import './common.scss'

interface StateViewProps {
  state: 'loading' | 'empty' | 'error' | 'login'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

export function StateView({ state, title, description, actionLabel, onAction, compact = false }: StateViewProps) {
  const icon = state === 'loading' ? 'refresh' : state === 'error' ? 'error' : state === 'login' ? 'user' : 'category'
  return (
    <View className={`state-view ${compact ? 'state-view--compact' : ''}`}>
      <View className={`state-view__icon state-view__icon--${state}`}>
        <AppIcon name={icon} size={30} />
      </View>
      <Text className='state-view__title'>{title}</Text>
      {description ? <Text className='state-view__description'>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button className='state-view__action pressable' onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </View>
  )
}
