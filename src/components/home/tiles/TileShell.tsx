import type { ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import './tiles.scss'

/**
 * 磁贴的统一外壳：左上角圆形图标 + 底部「标签 / 数值」。
 *
 * 对应 Flutter 三个 tile 组件里重复的那段布局，抽出来避免三份拷贝。
 */

/** 图标底色与数值颜色，对应 Flutter 磁贴里的 primaryColor 分档。 */
export type TileTone = 'primary' | 'success' | 'warning' | 'danger' | 'muted'

interface TileShellProps {
  icon: IconName
  tone: TileTone
  label: string
  value: string
  /** 数值行允许折成两行（校园卡的错误提示会用到）。 */
  valueLines?: 1 | 2
  /** 数值用更小的字号（无数据时的提示文案）。 */
  compactValue?: boolean
  onClick?: () => void
  /** 编辑模式下叠在磁贴上的控件。 */
  overlay?: ReactNode
}

export function TileShell({
  icon,
  tone,
  label,
  value,
  valueLines = 1,
  compactValue = false,
  onClick,
  overlay,
}: TileShellProps) {
  return (
    <View className={`tile tile--${tone} ${onClick ? 'pressable' : ''}`} onClick={onClick}>
      <View className='tile__icon'>
        <AppIcon name={icon} size={24} color='var(--tile-accent)' />
      </View>
      <View className='tile__footer'>
        <Text className='tile__label'>{label}</Text>
        <Text className={`tile__value ${compactValue ? 'tile__value--compact' : ''} ${valueLines === 2 ? 'tile__value--clamp-2' : ''}`}>
          {value}
        </Text>
      </View>
      {overlay}
    </View>
  )
}

/** 磁贴的数据加载态，与 Flutter 的 compact LoadingStateView 对应。 */
export function TileLoading({ text }: { text: string }) {
  return (
    <View className='tile tile--loading'>
      <Text className='tile__loading-text'>{text}</Text>
    </View>
  )
}
