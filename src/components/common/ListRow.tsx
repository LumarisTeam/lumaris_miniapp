import type { ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import type { IconName } from '@/components/common/AppIcon'
import { AppIcon } from '@/components/common/AppIcon'
import './common.scss'

interface ListRowProps {
  title: string
  subtitle?: string
  icon?: IconName
  iconColor?: string
  value?: string
  trailing?: ReactNode
  danger?: boolean
  onClick?: () => void
}

export function ListRow({ title, subtitle, icon, iconColor = 'var(--primary)', value, trailing, danger, onClick }: ListRowProps) {
  return (
    <View className={`list-row ${onClick ? 'pressable' : ''}`} onClick={onClick}>
      {icon ? (
        <View className='list-row__icon'><AppIcon name={icon} size={20} color={danger ? 'var(--danger)' : iconColor} /></View>
      ) : null}
      <View className='list-row__content'>
        <Text className={`list-row__title ${danger ? 'list-row__title--danger' : ''}`}>{title}</Text>
        {subtitle ? <Text className='list-row__subtitle'>{subtitle}</Text> : null}
      </View>
      {value ? <Text className='list-row__value'>{value}</Text> : null}
      {trailing ?? (onClick ? <AppIcon name='right' size={16} color='var(--tertiary-label)' /> : null)}
    </View>
  )
}
