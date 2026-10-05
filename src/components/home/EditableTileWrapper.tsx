import type { ReactNode } from 'react'
import { View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { useTileStore } from '@/stores/tile'
import type { ServiceType } from '@/types/domain'

interface EditableTileWrapperProps {
  tileId: ServiceType
  index: number
  count: number
  children: ReactNode
}

/**
 * 磁贴的编辑模式外壳：抖动 + 左上角移除 + 右下角前后移动。
 *
 * 对应 Flutter 的 `editable_tile_wrapper.dart`。差异：Flutter 用长按拖拽排序，
 * 小程序里拖拽排序需要 movable-view + 手算吸附位置，可靠性和可测性都差很多，
 * 所以改成显式的「前移/后移」按钮——行为（顺序可调、持久化）一致。
 */
export function EditableTileWrapper({ tileId, index, count, children }: EditableTileWrapperProps) {
  const isEditMode = useTileStore((state) => state.isEditMode)
  const toggleVisibility = useTileStore((state) => state.toggleVisibility)
  const move = useTileStore((state) => state.move)

  if (!isEditMode) {
    return <View className='tile-slot'>{children}</View>
  }

  return (
    <View
      className='tile-slot tile-slot--editing'
      // 每块错开 50ms，避免所有磁贴整齐划一地抖，与 Flutter 一致。
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {children}

      {/* 盖住磁贴内容，编辑模式下点机身不跳转。 */}
      <View className='tile-slot__blocker' />

      <View className='tile-slot__remove pressable' onClick={() => toggleVisibility(tileId)}>
        <View className='tile-slot__remove-bar' />
      </View>

      <View className='tile-slot__move'>
        <View
          className={`tile-slot__move-button pressable ${index === 0 ? 'tile-slot__move-button--disabled' : ''}`}
          onClick={() => move(tileId, -1)}
        >
          <AppIcon name='back' size={16} color='var(--label)' />
        </View>
        <View
          className={`tile-slot__move-button pressable ${index === count - 1 ? 'tile-slot__move-button--disabled' : ''}`}
          onClick={() => move(tileId, 1)}
        >
          <AppIcon name='right' size={16} color='var(--label)' />
        </View>
      </View>
    </View>
  )
}

/** 全部隐藏时的空态，对应 Flutter 的 EmptyTilesMessage。 */
export function EmptyTilesMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className='tile-empty'>
      <View className='tile-empty__icon'>
        <AppIcon name='category' size={28} color='var(--secondary-label)' />
      </View>
      <View className='tile-empty__text'>
        <View className='tile-empty__title'>{title}</View>
        <View className='tile-empty__subtitle'>{subtitle}</View>
      </View>
    </View>
  )
}
