import { useCallback, useState } from 'react'
import { Button, Input, Switch, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react-taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AppIcon } from '@/components/common/AppIcon'
import { ListRow } from '@/components/common/ListRow'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTileStore } from '@/stores/tile'
import { getPaymentSnapshot } from '@/services/domainRepository'
import type { PaymentRecord } from '@/types/domain'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 校园卡（饭卡）。
 *
 * 对应 Flutter 的 `lib/ui/pages/payment_page/payment_page.dart`：余额卡 →
 * 最近交易（只保留支付/消费/充值三类，最多 10 条）→ 设置（查询密码、首页磁贴）。
 *
 * 与 Flutter 的差异：Flutter 把查询密码写进安全存储，小程序这边只在本次会话的
 * 内存里留着——小程序的本地存储不是加密存储，写进去等于把教务密码明文落盘，
 * 与隐私政策里「不在本地保存密码」的承诺冲突。
 */

/** 流水分类是服务端返回的中文词，不是界面文案，所以不随语言切换。 */
const TRANSACTION_KEYWORDS = ['支付', '消费', '充值']
/** 列表最多展示这么多条，与 Flutter 一致。 */
const MAX_TRANSACTIONS = 10

function isTransactionRecord(record: PaymentRecord): boolean {
  return TRANSACTION_KEYWORDS.some((keyword) => record.turnoverType.includes(keyword))
}

export function PaymentContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const tileConfig = useTileStore((state) => state.config)
  const toggleTile = useTileStore((state) => state.toggleVisibility)

  const [cardId, setCardId] = useState(() => readStorage(STORAGE_KEYS.PAYMENT_ID, session?.username ?? ''))
  const [password, setPassword] = useState('')
  const [draftPassword, setDraftPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)

  const paymentTileVisible = tileConfig.configurations.some((tile) => tile.id === 'payment' && tile.isVisible)

  const load = useCallback(async (force = false) => {
    const targetCard = cardId.trim()
    if (!session || !targetCard) return
    setLoading(true)
    setError('')
    try {
      const snapshot = await getPaymentSnapshot(targetCard, password, schoolCode, force ? 'refresh' : 'local-first')
      setBalance(snapshot.data.balance)
      setRecords(snapshot.data.records)
      setHasData(true)
      setIsStale(snapshot.isStale)
      writeStorage(STORAGE_KEYS.PAYMENT_ID, targetCard)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getPaymentSnapshot(targetCard, password, schoolCode, 'refresh')
        setBalance(refreshed.data.balance)
        setRecords(refreshed.data.records)
        setIsStale(refreshed.isStale)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [cardId, password, schoolCode, session, t])

  // useDidShow 里的回调始终指向最新一次 render 的闭包，所以切卡号后重新进页面
  // 会读到新的 cardId，不需要额外再挂一个 useEffect（那会在首次进入时请求两次）。
  useDidShow(() => { if (session && cardId.trim()) void load() })
  usePullDownRefresh(() => { void load(true).finally(() => Taro.stopPullDownRefresh()) })

  const transactions = records.filter(isTransactionRecord).slice(0, MAX_TRANSACTIONS)

  const openPasswordDialog = () => {
    setDraftPassword(password)
    setPasswordVisible(true)
  }

  const savePassword = async () => {
    const next = draftPassword.trim()
    setPassword(next)
    setPasswordVisible(false)
    Taro.showToast({ title: t('save'), icon: 'none' })
    await load(true)
  }

  return (
    <PageShell
      title={t('campusCard')}
      showBack
      action={
        <View className='icon-action pressable' onClick={() => void load(true)}>
          <AppIcon name='refresh' size={20} />
        </View>
      }
    >
      {!session ? (
        <StateView
          state='login'
          title={t('guestMode')}
          description={t('guestModeSubtitle')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      ) : (
        <>
          {isStale ? <View className='page-section'><View className='page-note'>{t('refreshFailedFallback')}</View></View> : null}

          <View className='page-section'>
            <View className='payment-card'>
              <View className='payment-card__head'>
                <Text className='payment-card__brand'>{t('campusCard')}</Text>
                <AppIcon name='card' size={26} color='var(--on-accent)' />
              </View>
              <Text className='payment-card__label'>{t('currentBalance')}</Text>
              <Text className='payment-card__balance'>
                {hasData && balance !== null ? `¥${balance.toFixed(2)}` : '¥ ---'}
              </Text>
            </View>
          </View>

          <View className='page-section'>
            <ClubCard padding='none'>
              <View className='payment-cardid'>
                <Text className='form-label'>{t('campusCard')}</Text>
                <Input
                  className='form-input'
                  value={cardId}
                  placeholder={session.username}
                  onInput={(event) => setCardId(event.detail.value)}
                />
              </View>
            </ClubCard>
          </View>

          <View className='page-section'>
            {loading && !hasData ? (
              <StateView state='loading' title={t('paymentLoading')} description={t('paymentLoadingSubtitle')} />
            ) : error && !hasData ? (
              <ClubCard>
                <StateView state='empty' title={t('noCardData')} description={t('noCardDataSubtitle')} />
                {error ? <Text className='payment-error'>{error}</Text> : null}
              </ClubCard>
            ) : transactions.length === 0 ? (
              <StateView state='empty' title={t('noCardData')} description={t('noCardDataSubtitle')} />
            ) : (
              <>
                <SectionHeader title={t('recentTransactions')} icon='list' />
                <ClubCard padding='none'>
                  {transactions.map((record) => (
                    <PaymentRow key={record.id} record={record} />
                  ))}
                </ClubCard>
              </>
            )}
          </View>

          <View className='page-section'>
            <SectionHeader title={t('settings')} icon='settings' />
            <ClubCard padding='none'>
              <ListRow
                title={t('paymentPasswordTitle')}
                subtitle={password ? '••••••••' : t('paymentPasswordSubtitle')}
                icon='card'
                onClick={openPasswordDialog}
              />
              <ListRow
                title={t('showPaymentTile')}
                subtitle={t('showPaymentTileSubtitle')}
                icon='home'
                trailing={<Switch checked={paymentTileVisible} color='#007aff' onChange={() => toggleTile('payment')} />}
              />
            </ClubCard>
          </View>
        </>
      )}

      <Dialog title={t('paymentPasswordTitle')} visible={passwordVisible} footer={null} onClose={() => setPasswordVisible(false)}>
        <Text className='form-label'>{t('paymentPasswordSubtitle')}</Text>
        <Input
          className='form-input'
          password
          value={draftPassword}
          placeholder={t('password')}
          onInput={(event) => setDraftPassword(event.detail.value)}
        />
        <View className='dialog-actions'>
          <Button className='secondary-button' onClick={() => setPasswordVisible(false)}>{t('cancel')}</Button>
          <Button className='primary-button' onClick={() => void savePassword()}>{t('paymentSaveAndRefresh')}</Button>
        </View>
      </Dialog>
    </PageShell>
  )
}

function PaymentRow({ record }: { record: PaymentRecord }) {
  const isRecharge = record.turnoverType.includes('充值')
  return (
    <View className='payment-row'>
      <View className='grow'>
        <Text className='payment-row__title'>{record.description.trim() || record.turnoverType}</Text>
        <Text className='payment-row__meta'>{record.datetime}</Text>
      </View>
      <Text className={`payment-row__amount ${isRecharge ? 'payment-row__amount--income' : ''}`}>
        {`${isRecharge ? '+' : '-'}${Math.abs(record.amount).toFixed(2)}`}
      </Text>
    </View>
  )
}

export default function PaymentPage() {
  const t = useTranslation()
  return <FeatureGuard feature='payment' title={t('payment')}><PaymentContent /></FeatureGuard>
}
