import Taro from '@tarojs/taro'
import { TileLoading, TileShell } from '@/components/home/tiles/TileShell'
import { LOW_BALANCE_THRESHOLD, useTileDataStore } from '@/stores/tileData'
import { useTranslation } from '@/i18n'

const ROUTE = '/subpackages/services/electricity/index'

/** 首页电费磁贴：显示余额，余额偏低时转红；未订阅时提示订阅。 */
export function ElectricityTile() {
  const t = useTranslation()
  const electricity = useTileDataStore((state) => state.electricity)
  const open = () => void Taro.navigateTo({ url: ROUTE })

  if (electricity.isLoading) return <TileLoading text={t('electricityLoading')} />

  if (electricity.balance !== null) {
    const isLow = electricity.balance <= LOW_BALANCE_THRESHOLD
    return (
      <TileShell
        icon='power'
        tone={isLow ? 'danger' : 'primary'}
        label={t('electricityBalance')}
        value={`¥${electricity.balance.toFixed(2)}`}
        onClick={open}
      />
    )
  }

  return (
    <TileShell
      icon='power'
      tone='muted'
      label={t('electricity')}
      value={electricity.hasConfiguredSource ? t('electricityNoData') : t('tapToSubscribe')}
      compactValue
      onClick={open}
    />
  )
}
