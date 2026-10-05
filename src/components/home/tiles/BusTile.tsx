import Taro from '@tarojs/taro'
import { TileLoading, TileShell } from '@/components/home/tiles/TileShell'
import { useTileDataStore } from '@/stores/tileData'
import { useTranslation } from '@/i18n'

const ROUTE = '/subpackages/services/bus/index'

/** 首页校车磁贴：显示今天还剩几班。 */
export function BusTile() {
  const t = useTranslation()
  const bus = useTileDataStore((state) => state.bus)
  const open = () => void Taro.navigateTo({ url: ROUTE })

  if (bus.isLoading) return <TileLoading text={t('busLoading')} />

  return (
    <TileShell
      icon='service'
      tone={bus.count > 0 ? 'success' : 'muted'}
      label={t('schoolBus')}
      value={bus.count > 0 ? String(bus.count) : t('noBusToday')}
      compactValue={bus.count === 0}
      onClick={open}
    />
  )
}
