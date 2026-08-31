import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'
import './common.scss'

interface ClubCardProps extends PropsWithChildren {
  className?: string
  onClick?: () => void
  padding?: 'none' | 'compact' | 'normal'
}

export function ClubCard({ className = '', onClick, padding = 'normal', children }: ClubCardProps) {
  return (
    <View
      className={`club-card club-card--${padding} ${onClick ? 'pressable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
