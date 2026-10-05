import { View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { AvailableTilesList } from '@/components/home/AvailableTilesList'
import { EmptyTilesMessage, EditableTileWrapper } from '@/components/home/EditableTileWrapper'
import { TileEditControls } from '@/components/home/TileEditControls'
import { BusTile } from '@/components/home/tiles/BusTile'
import { ElectricityTile } from '@/components/home/tiles/ElectricityTile'
import { PaymentTile } from '@/components/home/tiles/PaymentTile'
import { useAppStore } from '@/stores/app'
import { useTileStore } from '@/stores/tile'
import { loadVisibleTileData } from '@/stores/tileData'
import { useTranslation } from '@/i18n'
import { getVisibleTiles, isTileSupported } from '@/utils/tileConfiguration'
import type { ServiceType } from '@/types/domain'
import './tiles.scss'

/**
 * 首页快捷方式区块：标题 + 编辑按钮 + 磁贴网格 + 编辑模式下的「更多功能」。
 *
 * 对应 Flutter 的 `lib/ui/pages/home_page/tiles_widget.dart`。
 */

function renderTile(tileId: ServiceType) {
  switch (tileId) {
    case 'electricity':
      return <ElectricityTile />
    case 'bus':
      return <BusTile />
    case 'payment':
      return <PaymentTile />
  }
}

export function TilesWidget() {
  const t = useTranslation()
  const config = useTileStore((state) => state.config)
  const isEditMode = useTileStore((state) => state.isEditMode)
  const features = useAppStore((state) => state.school.features)

  // 学校不支持的服务不出现在首页，也不去拉数据。
  const visible = getVisibleTiles(config).filter((tile) => isTileSupported(tile.id, features))

  useDidShow(() => {
    void loadVisibleTileData(visible.map((tile) => tile.id))
  })

  return (
    <>
      <TileEditControls />
      {isEditMode ? <AvailableTilesList /> : null}

      {visible.length === 0 ? (
        <EmptyTilesMessage title={t('noShortcuts')} subtitle={t('addInEditMode')} />
      ) : (
        <View className='tile-grid'>
          {visible.map((tile, index) => (
            <EditableTileWrapper
              key={tile.id}
              tileId={tile.id}
              index={index}
              count={visible.length}
            >
              {renderTile(tile.id)}
            </EditableTileWrapper>
          ))}
        </View>
      )}
    </>
  )
}
