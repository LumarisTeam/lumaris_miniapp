import Taro from '@tarojs/taro'
import { TileLoading, TileShell } from '@/components/home/tiles/TileShell'
import { LOW_BALANCE_THRESHOLD, useTileDataStore } from '@/stores/tileData'
import { useTranslation } from '@/i18n'

const ROUTE = '/subpackages/services/payment/index'

/** 首页校园卡磁贴：显示余额，查询失败时把错误直接显示出来。 */
export function PaymentTile() {
  const t = useTranslation()
  const payment = useTileDataStore((state) => state.payment)
  const open = () => void Taro.navigateTo({ url: ROUTE })

  if (payment.isLoading) return <TileLoading text={t('readingPaymentCard')} />

  if (payment.hasData && payment.balance !== null) {
    const isLow = payment.balance <= LOW_BALANCE_THRESHOLD
    return (
      <TileShell
        icon='card'
        tone={isLow ? 'danger' : 'warning'}
        label={t('currentBalance')}
        value={`¥${payment.balance.toFixed(2)}`}
        onClick={open}
      />
    )
  }

  return (
    <TileShell
      icon='card'
      tone={payment.error ? 'danger' : 'muted'}
      label={t('campusCardBalance')}
      value={payment.error || t('tapToView')}
      compactValue={!payment.error}
      valueLines={2}
      onClick={open}
    />
  )
}
