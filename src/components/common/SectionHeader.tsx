import type { ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import type { IconName } from '@/components/common/AppIcon'
import { AppIcon } from '@/components/common/AppIcon'
import './common.scss'

interface SectionHeaderProps {
  title: string
  icon?: IconName
  /** 右侧内容：传字符串会按次要文字样式渲染，也可以传按钮等自定义节点。 */
  trailing?: ReactNode
  compact?: boolean
}

export function SectionHeader({ title, icon, trailing, compact = false }: SectionHeaderProps) {
  return (
    <View className={`section-header ${compact ? 'section-header--compact' : ''}`}>
      <View className='section-header__title-row'>
        {icon ? <AppIcon name={icon} size={20} color='var(--primary)' /> : null}
        <Text className='section-header__title'>{title}</Text>
      </View>
      {typeof trailing === 'string'
        ? <Text className='section-header__trailing'>{trailing}</Text>
        : trailing}
    </View>
  )
}
