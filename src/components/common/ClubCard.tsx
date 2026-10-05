import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'
import './common.scss'

interface ClubCardProps extends PropsWithChildren {
  className?: string
  onClick?: () => void
  padding?: 'none' | 'compact' | 'normal'
  /** 圆角档位，对应 Flutter ClubCard 的 borderRadius 参数；默认卡片圆角。 */
  radius?: 'card' | 'navigation' | 'panel'
}

const RADIUS_VAR: Record<NonNullable<ClubCardProps['radius']>, string> = {
  card: 'var(--radius-card)',
  navigation: 'var(--radius-navigation)',
  panel: 'var(--radius-panel)',
}

export function ClubCard({
  className = '',
  onClick,
  padding = 'normal',
  radius,
  children,
}: ClubCardProps) {
  return (
    <View
      className={`club-card club-card--${padding} ${onClick ? 'pressable' : ''} ${className}`}
      style={radius ? { borderRadius: RADIUS_VAR[radius] } : undefined}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
