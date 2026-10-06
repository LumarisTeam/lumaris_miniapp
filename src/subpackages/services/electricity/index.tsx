import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, ScrollView, Switch, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react-taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AppIcon } from '@/components/common/AppIcon'
import { ListRow } from '@/components/common/ListRow'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import {
  createElectricitySubscription,
  deleteElectricitySubscription,
  fetchElectricitySubscription,
  fetchRechargeUrl,
} from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTileStore } from '@/stores/tile'
import type { ElectricPoint, ElectricitySubscription } from '@/types/domain'
import { getElectricitySnapshot } from '@/services/domainRepository'
import { openExternalUrl } from '@/utils/platform'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import { summarizeElectricity } from '@/utils/education'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 电费管理。
 *
 * 对应 Flutter 的 `lib/ui/pages/electricity_page/electricity_page.dart`：
 * 余额头部 → 用电花费卡片（四个指标 + 近 24 小时柱状明细）→ 设置（首页磁贴、
 * 充值）→ 低余额订阅。右上角按钮在「添加数据源」与「刷新/更换房间」之间切换。
 */

/** 与 Flutter 一致：低于这个余额按「余额不足」高亮。 */
const LOW_BALANCE = 10

/** 每小时明细条最多画这么多根，和 Flutter `_buildHourlyCostScroller` 相同。 */
const HOURLY_WINDOW = 24

function formatHour(point: ElectricPoint): string {
  const date = new Date(point.timestamp)
  return Number.isNaN(date.getTime()) ? point.timestamp : `${date.getHours()}:00`
}

export function ElectricityContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const tileConfig = useTileStore((state) => state.config)
  const toggleTile = useTileStore((state) => state.toggleVisibility)

  const [sourceUrl, setSourceUrl] = useState(() => readStorage(STORAGE_KEYS.ELECTRICITY_URL, ''))
  const [draftUrl, setDraftUrl] = useState(sourceUrl)
  const [balance, setBalance] = useState<number | null>(null)
  const [points, setPoints] = useState<ElectricPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)

  const [email, setEmail] = useState(() => readStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, ''))
  const [draftEmail, setDraftEmail] = useState(email)
  const [draftThreshold, setDraftThreshold] = useState('10')
  const [subscription, setSubscription] = useState<ElectricitySubscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const [sourceVisible, setSourceVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)

  const hasData = balance !== null
  const hasConfiguredSource = sourceUrl.trim().length > 0
  const electricityTileVisible = tileConfig.configurations.some((tile) => tile.id === 'electricity' && tile.isVisible)

  const load = useCallback(async (force = false) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const snapshot = await getElectricitySnapshot(session.username, schoolCode, sourceUrl, force ? 'refresh' : 'local-first')
      setBalance(snapshot.data.balance)
      setPoints(snapshot.data.points)
      setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getElectricitySnapshot(session.username, schoolCode, sourceUrl, 'refresh')
        setBalance(refreshed.data.balance)
        setPoints(refreshed.data.points)
        setIsStale(refreshed.isStale)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [schoolCode, session, sourceUrl, t])

  const querySubscription = useCallback(async (targetEmail = email) => {
    const trimmed = targetEmail.trim()
    if (!trimmed) {
      setSubscription(null)
      return
    }
    setSubscriptionLoading(true)
    try {
      const result = await fetchElectricitySubscription(trimmed)
      setSubscription(result)
      writeStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, trimmed)
      setEmail(trimmed)
    } catch (queryError) {
      Taro.showToast({ title: queryError instanceof Error ? queryError.message : t('electricitySubLoadFailed'), icon: 'none' })
    } finally {
      setSubscriptionLoading(false)
    }
  }, [email, t])

  useDidShow(() => { void load() })
  useEffect(() => {
    // 已绑定过提醒邮箱时进页面就查一次，与 Flutter `_loadSubscriptions` 一致。
    if (readStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, '').trim()) void querySubscription()
    // 只在首次进入时查询；之后由用户显式刷新。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  usePullDownRefresh(() => {
    void load(true).then(() => querySubscription()).finally(() => Taro.stopPullDownRefresh())
  })

  const summary = useMemo(() => summarizeElectricity(points), [points])
  const hourly = useMemo(() => points.slice(-HOURLY_WINDOW), [points])
  const maxHourly = useMemo(() => hourly.reduce((max, point) => Math.max(max, point.value), 0), [hourly])
  const dayCount = useMemo(() => new Set(points.map((point) => point.timestamp.slice(0, 10))).size, [points])

  const statusText = hasData
    ? (balance !== null && balance <= LOW_BALANCE ? t('electricityLowBalance') : t('electricitySufficient'))
    : hasConfiguredSource ? t('fetchFailed') : t('electricityAddTip')

  const openSourceDialog = () => {
    setDraftUrl(sourceUrl)
    setSourceVisible(true)
  }

  const saveSource = async () => {
    const next = draftUrl.trim()
    writeStorage(STORAGE_KEYS.ELECTRICITY_URL, next)
    setSourceUrl(next)
    setSourceVisible(false)
    await load(true)
  }

  const submitSubscription = async () => {
    const trimmedEmail = draftEmail.trim()
    const amount = Number(draftThreshold)
    if (!trimmedEmail) {
      Taro.showToast({ title: t('pleaseEnterEmail'), icon: 'none' })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      Taro.showToast({ title: t('pleaseEnterValidEmail'), icon: 'none' })
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Taro.showToast({ title: t('pleaseEnterThreshold'), icon: 'none' })
      return
    }
    setSubscriptionLoading(true)
    try {
      await createElectricitySubscription(sourceUrl, trimmedEmail, amount)
      setCreateVisible(false)
      writeStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, trimmedEmail)
      setEmail(trimmedEmail)
      await querySubscription(trimmedEmail)
      Taro.showToast({ title: t('lowBalanceAlertCreated'), icon: 'success' })
    } catch (createError) {
      Taro.showToast({ title: `${t('createSubFailed')}: ${createError instanceof Error ? createError.message : ''}`, icon: 'none' })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const removeSubscription = async () => {
    if (!subscription?.subscriptionId) {
      Taro.showToast({ title: t('noSubToDelete'), icon: 'none' })
      return
    }
    setSubscriptionLoading(true)
    try {
      await deleteElectricitySubscription(subscription.subscriptionId)
      setSubscription(null)
      Taro.showToast({ title: t('lowBalanceAlertDeleted'), icon: 'success' })
    } catch (deleteError) {
      Taro.showToast({ title: `${t('deleteSubFailed')}: ${deleteError instanceof Error ? deleteError.message : ''}`, icon: 'none' })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  /** 右上角按钮：已有数据时让用户选刷新还是换房间，否则直接去配置数据源。 */
  const handleAction = () => {
    if (!hasData && !hasConfiguredSource) {
      openSourceDialog()
      return
    }
    void Taro.showActionSheet({ itemList: [t('refreshData'), t('changeRoom')] })
      .then(({ tapIndex }) => {
        if (tapIndex === 0) void load(true).then(() => querySubscription())
        else openSourceDialog()
      })
      .catch(() => {
        // 用户取消选择，不做任何事。
      })
  }

  const confirmRemoveSubscription = () => {
    Taro.showModal({
      title: t('deleteSubTitle'),
      content: t('deleteSubConfirmContent'),
      confirmText: t('delete'),
      confirmColor: '#ff3b30',
      success: ({ confirm }) => { if (confirm) void removeSubscription() },
    })
  }

  const openRecharge = () => {
    void fetchRechargeUrl(sourceUrl || undefined)
      .then(openExternalUrl)
      .catch((rechargeError: unknown) => {
        Taro.showToast({ title: rechargeError instanceof Error ? rechargeError.message : t('loadFailed'), icon: 'none' })
      })
  }

  return (
    <PageShell
      title={t('electricityManagement')}
      showBack
      action={
        <View className='icon-action pressable' onClick={handleAction}>
          <AppIcon name={hasData || hasConfiguredSource ? 'refresh' : 'add'} size={20} />
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
            <ClubCard>
              <View className='electricity-balance'>
                <Text className='electricity-balance__label'>{t('currentBalance')}</Text>
                {hasData ? (
                  <View className='electricity-balance__amount'>
                    <Text className='electricity-balance__symbol'>¥</Text>
                    <Text className='electricity-balance__value'>{balance?.toFixed(2)}</Text>
                  </View>
                ) : (
                  <Text className='electricity-balance__empty'>{t('electricityNoData')}</Text>
                )}
                <Text className={`tag ${hasData && balance !== null && balance <= LOW_BALANCE ? 'electricity-balance__status--low' : ''}`}>
                  {statusText}
                </Text>
                {error ? <Text className='electricity-balance__error'>{error}</Text> : null}
              </View>
            </ClubCard>
          </View>

          {hasData ? (
            <View className='page-section'>
              <SectionHeader title={t('electricityCost')} icon='notice' trailing={t('lastNDays', { n: dayCount })} />
              <ClubCard>
                {loading && points.length === 0 ? (
                  <StateView state='loading' compact title={t('electricityLoading')} />
                ) : points.length === 0 ? (
                  <StateView state='empty' compact title={t('noUsageDetails')} description={t('noUsageDetailsSubtitle')} />
                ) : (
                  <>
                    <View className='electricity-metrics'>
                      <ElectricityMetric label={t('totalCost')} value={`¥${summary.total.toFixed(2)}`} />
                      <ElectricityMetric label={t('todayCost')} value={`¥${summary.today.toFixed(2)}`} />
                      <ElectricityMetric label={t('avgDailyCost')} value={`¥${summary.averageDaily.toFixed(2)}`} />
                      <ElectricityMetric
                        label={t('peakHours')}
                        value={summary.peak ? `${formatHour(summary.peak)} / ¥${summary.peak.value.toFixed(1)}` : '--'}
                      />
                    </View>

                    <Text className='electricity-hourly__title'>{t('hourlyDetails')}</Text>
                    <ScrollView className='electricity-hourly' scrollX enableFlex>
                      <View className='electricity-hourly__row'>
                        {hourly.map((point) => (
                          <View className='electricity-hourly__item' key={`${point.timestamp}-${point.value}`}>
                            <Text className='electricity-hourly__value'>{point.value.toFixed(1)}</Text>
                            <View className='electricity-hourly__track'>
                              <View
                                className='electricity-hourly__bar'
                                style={{ height: `${Math.round(Math.min(1, Math.max(0.05, maxHourly > 0 ? point.value / maxHourly : 0)) * 100)}%` }}
                              />
                            </View>
                            <Text className='electricity-hourly__hour'>{formatHour(point)}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}
              </ClubCard>
            </View>
          ) : null}

          {hasData ? (
            <View className='page-section'>
              <SectionHeader title={t('settings')} icon='settings' />
              <ClubCard padding='none'>
                <ListRow
                  title={t('addToHome')}
                  subtitle={t('showElectricityTile')}
                  icon='home'
                  trailing={<Switch checked={electricityTileVisible} color='#007aff' onChange={() => toggleTile('electricity')} />}
                />
                <ListRow title={t('electricityRecharge')} subtitle={t('electricityRechargeSubtitle')} icon='card' onClick={openRecharge} />
              </ClubCard>
            </View>
          ) : null}

          <View className='page-section'>
            <SectionHeader
              title={t('lowBalanceSub')}
              icon='bell'
              trailing={hasData ? (
                <View className='icon-action pressable' onClick={() => void querySubscription()}>
                  <AppIcon name='refresh' size={18} />
                </View>
              ) : undefined}
            />
            <ClubCard padding='none'>
              {!hasData ? (
                <StateView state='empty' compact title={t('noElectricityData')} description={t('noElectricityDataSubtitle')} />
              ) : (
                <>
                  <ListRow
                    title={subscription?.hasSubscription ? t('lowBalanceEnabled') : t('createLowBalanceAlert')}
                    subtitle={subscription?.hasSubscription && email
                      ? t('currentSubInfo', { email, threshold: formatThreshold(subscription.threshold) })
                      : t('subSetupHint')}
                    icon={subscription?.hasSubscription ? 'check' : 'bell'}
                    onClick={() => {
                      if (subscription?.hasSubscription) {
                        setDetailVisible(true)
                      } else {
                        setDraftEmail(email)
                        setCreateVisible(true)
                      }
                    }}
                  />
                  {subscription?.hasSubscription ? (
                    <ListRow title={t('deleteSubscription')} subtitle={t('deleteSubDesc')} icon='delete' danger onClick={confirmRemoveSubscription} />
                  ) : null}
                  {subscriptionLoading ? <StateView state='loading' compact title={t('electricityLoading')} /> : null}
                </>
              )}
            </ClubCard>
          </View>
        </>
      )}

      <Dialog
        title={t('getElectricity')}
        visible={sourceVisible}
        footer={null}
        onClose={() => setSourceVisible(false)}
      >
        <Text className='form-label'>{t('electricityUrlPrompt')}</Text>
        <Input className='form-input' value={draftUrl} placeholder={t('urlPlaceholder')} onInput={(event) => setDraftUrl(event.detail.value)} />
        <View className='dialog-actions'>
          <Button className='secondary-button' onClick={() => setSourceVisible(false)}>{t('cancel')}</Button>
          <Button className='primary-button' onClick={() => void saveSource()}>{t('confirm')}</Button>
        </View>
      </Dialog>

      <Dialog
        title={t('createLowBalanceAlert')}
        visible={createVisible}
        footer={null}
        onClose={() => setCreateVisible(false)}
      >
        <Text className='form-label'>{t('lowBalanceAlertDesc')}</Text>
        <Input className='form-input' type='text' value={draftEmail} placeholder={t('remindEmailPlaceholder')} onInput={(event) => setDraftEmail(event.detail.value)} />
        <Input className='form-input electricity-form__gap' type='digit' value={draftThreshold} placeholder={t('remindThresholdPlaceholder')} onInput={(event) => setDraftThreshold(event.detail.value)} />
        <View className='dialog-actions'>
          <Button className='secondary-button' onClick={() => setCreateVisible(false)}>{t('cancel')}</Button>
          <Button className='primary-button' loading={subscriptionLoading} onClick={() => void submitSubscription()}>{t('create')}</Button>
        </View>
      </Dialog>

      <Dialog title={t('lowBalanceSub')} visible={detailVisible} footer={null} onClose={() => setDetailVisible(false)}>
        <View className='electricity-detail'>
          <View className='electricity-detail__row'>
            <Text className='electricity-detail__label'>{t('remindEmailLabel')}</Text>
            <Text className='electricity-detail__value'>{email || t('notSet')}</Text>
          </View>
          <View className='electricity-detail__row'>
            <Text className='electricity-detail__label'>{t('remindThresholdLabel')}</Text>
            <Text className='electricity-detail__value'>{`${formatThreshold(subscription?.threshold ?? 0)} ${t('currencyUnit')}`}</Text>
          </View>
        </View>
        <Button className='primary-button' onClick={() => setDetailVisible(false)}>{t('gotIt')}</Button>
      </Dialog>
    </PageShell>
  )
}

function ElectricityMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className='electricity-metric'>
      <Text className='electricity-metric__label'>{label}</Text>
      <Text className='electricity-metric__value'>{value}</Text>
    </View>
  )
}

/** 阈值按 Flutter `_formatThreshold`：整数不带小数，否则保留两位。 */
function formatThreshold(threshold: number): string {
  if (!Number.isFinite(threshold)) return '--'
  return Number.isInteger(threshold) ? threshold.toFixed(0) : threshold.toFixed(2)
}

export default function ElectricityPage() {
  const t = useTranslation()
  return <FeatureGuard feature='electricity' title={t('electricity')}><ElectricityContent /></FeatureGuard>
}
