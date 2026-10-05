import { Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { useAppStore } from '@/stores/app'
import { useTileStore } from '@/stores/tile'
import { useTranslation, type MessageKey } from '@/i18n'
import { isTileSupported } from '@/utils/tileConfiguration'
import type { ServiceType } from '@/types/domain'

/** 磁贴名称的文案键。 */
const TILE_LABEL_KEY: Record<ServiceType, MessageKey> = {
  electricity: 'electricity',
  bus: 'schoolBus',
  payment: 'payment',
}

/**
 * 编辑模式下的「更多功能」列表：列出被隐藏、且当前学校支持的磁贴。
 *
 * 对应 Flutter 的 `AvailableTilesList`。
 */
export function AvailableTilesList() {
  const t = useTranslation()
  const config = useTileStore((state) => state.config)
  const toggleVisibility = useTileStore((state) => state.toggleVisibility)
  const features = useAppStore((state) => state.school.features)

  const hidden = config.configurations.filter(
    (tile) => !tile.isVisible && isTileSupported(tile.id, features),
  )
  if (hidden.length === 0) return null

  return (
    <View className='tile-available'>
      <Text className='tile-available__title'>{t('moreFunctions')}</Text>
      <ClubCard padding='none'>
        {hidden.map((tile) => (
          <ListRow
            key={tile.id}
            title={t(TILE_LABEL_KEY[tile.id])}
            trailing={
              <View className='tile-available__add'>
                <AppIcon name='add' size={16} color='var(--on-accent)' />
              </View>
            }
            onClick={() => toggleVisibility(tile.id)}
          />
        ))}
      </ClubCard>
    </View>
  )
}
