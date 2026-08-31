import { useMemo, useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react-taro'
import F2Canvas from 'taro-f2-react'
import { Axis, Chart, Line, Tooltip } from '@antv/f2'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AppIcon } from '@/components/common/AppIcon'
import { ListRow } from '@/components/common/ListRow'
import {
  createElectricitySubscription,
  deleteElectricitySubscription,
  fetchElectricity,
  fetchElectricitySubscription,
  fetchElectricityWeekly,
  fetchRechargeUrl,
} from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import type { ElectricPoint, ElectricitySubscription } from '@/types/domain'
import { openExternalUrl } from '@/utils/platform'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import '@/styles/pages.scss'
import './index.scss'

export default function ElectricityPage() {
  const session = useAuthStore((state) => state.session)
  const [sourceUrl, setSourceUrl] = useState(() => readStorage(STORAGE_KEYS.ELECTRICITY_URL, ''))
  const [balance, setBalance] = useState<number | null>(null)
  const [points, setPoints] = useState<ElectricPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sourceDialog, setSourceDialog] = useState(false)
  const [subscriptionDialog, setSubscriptionDialog] = useState(false)
  const [email, setEmail] = useState(() => readStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, ''))
  const [threshold, setThreshold] = useState('20')
  const [subscription, setSubscription] = useState<ElectricitySubscription | null>(null)

  const load = async () => {
    if (!session) return
    setLoading(true)
    setError('')
    const [balanceResult, pointsResult] = await Promise.allSettled([
      fetchElectricity(sourceUrl || undefined),
      fetchElectricityWeekly(sourceUrl || undefined),
    ])
    if (balanceResult.status === 'fulfilled') setBalance(balanceResult.value)
    if (pointsResult.status === 'fulfilled') setPoints(pointsResult.value)
    if (balanceResult.status === 'rejected' && pointsResult.status === 'rejected') setError(balanceResult.reason instanceof Error ? balanceResult.reason.message : '电费数据加载失败')
    setLoading(false)
  }

  useDidShow(() => { void load() })
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })

  const chartData = useMemo(() => points.slice(-24).map((point) => ({ time: point.timestamp.slice(11, 16) || point.timestamp.slice(5, 10), value: point.value })), [points])
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const peak = points.reduce((maximum, point) => Math.max(maximum, point.value), 0)
  const status = balance === null ? '待获取' : balance < 10 ? '余额较低' : '余额充足'

  const saveSource = () => {
    writeStorage(STORAGE_KEYS.ELECTRICITY_URL, sourceUrl.trim())
    setSourceDialog(false)
    void load()
  }

  const querySubscription = async () => {
    if (!email.trim()) return
    try {
      const result = await fetchElectricitySubscription(email.trim())
      setSubscription(result)
      writeStorage(STORAGE_KEYS.ELECTRICITY_EMAIL, email.trim())
    } catch (queryError) {
      Taro.showToast({ title: queryError instanceof Error ? queryError.message : '查询失败', icon: 'none' })
    }
  }

  const createSubscription = async () => {
    const amount = Number(threshold)
    if (!/^\S+@\S+\.\S+$/.test(email) || !Number.isFinite(amount) || amount <= 0) {
      Taro.showToast({ title: '请输入有效邮箱和阈值', icon: 'none' })
      return
    }
    await createElectricitySubscription(sourceUrl, email.trim(), amount)
    setSubscriptionDialog(false)
    await querySubscription()
    Taro.showToast({ title: '提醒已创建', icon: 'success' })
  }

  return (
    <PageShell title='电费' showBack action={<View className='icon-action pressable' onClick={() => void load()}><AppIcon name='refresh' size={20} /></View>}>
      {!session ? <StateView state='login' title='登录后查看电费信息' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /> : (
        <>
          <View className='page-section'>
            <ClubCard>
              <Text className='electricity-balance__label'>当前余额</Text>
              <View className='row row--between'><Text className='electricity-balance__value'>¥ {balance === null ? '--' : balance.toFixed(2)}</Text><Text className={`tag ${balance !== null && balance < 10 ? 'electricity-balance__danger' : ''}`}>{status}</Text></View>
              {error ? <Text className='electricity-error'>{error}</Text> : null}
            </ClubCard>
          </View>

          <View className='page-section'>
            <SectionHeader title='近 24 小时' icon='notice' />
            <ClubCard>
              {loading && points.length === 0 ? <StateView state='loading' compact title='正在读取用电数据' /> : chartData.length === 0 ? <StateView state='empty' compact title='暂无用电趋势' actionLabel='配置数据源' onAction={() => setSourceDialog(true)} /> : (
                <>
                  <View className='metric-grid'>
                    <View className='metric'><Text className='metric__value'>¥{total.toFixed(1)}</Text><Text className='metric__label'>累计消耗</Text></View>
                    <View className='metric'><Text className='metric__value'>¥{(total / Math.max(1, points.length)).toFixed(2)}</Text><Text className='metric__label'>时均消耗</Text></View>
                    <View className='metric'><Text className='metric__value'>¥{peak.toFixed(2)}</Text><Text className='metric__label'>峰值</Text></View>
                  </View>
                  <View className='electricity-chart'>
                    <F2Canvas id='electricity-line-chart'>
                      <Chart data={chartData}>
                        <Axis field='time' tickCount={5} />
                        <Axis field='value' tickCount={4} />
                        <Line x='time' y='value' color='#007aff' />
                        <Tooltip />
                      </Chart>
                    </F2Canvas>
                  </View>
                </>
              )}
            </ClubCard>
          </View>

          <View className='page-section'>
            <SectionHeader title='设置' icon='settings' />
            <ClubCard padding='none'>
              <ListRow title='电费数据源' subtitle={sourceUrl || '使用账号默认配置'} icon='link' onClick={() => setSourceDialog(true)} />
              <ListRow title='充值' subtitle='获取充值页面链接' icon='card' onClick={() => void fetchRechargeUrl(sourceUrl || undefined).then(openExternalUrl).catch((rechargeError) => Taro.showToast({ title: rechargeError.message, icon: 'none' }))} />
              <ListRow title='低余额邮件提醒' subtitle={subscription?.hasSubscription ? `${subscription.email} · ¥${subscription.threshold}` : '查询或创建邮件提醒'} icon='bell' onClick={() => setSubscriptionDialog(true)} />
              {subscription?.hasSubscription ? <ListRow title='删除低余额提醒' icon='delete' danger onClick={() => void deleteElectricitySubscription(subscription.subscriptionId).then(() => { setSubscription(null); Taro.showToast({ title: '提醒已删除', icon: 'success' }) })} /> : null}
            </ClubCard>
          </View>
        </>
      )}

      <Dialog title='配置电费数据源' visible={sourceDialog} footer={null} onClose={() => setSourceDialog(false)}>
        <Text className='form-label'>数据源 URL（留空使用账号默认值）</Text><Input className='form-input' value={sourceUrl} placeholder='https://...' onInput={(event) => setSourceUrl(event.detail.value)} />
        <View className='dialog-actions'><Button className='secondary-button' onClick={() => setSourceDialog(false)}>取消</Button><Button className='primary-button' onClick={saveSource}>保存并刷新</Button></View>
      </Dialog>
      <Dialog title='低余额邮件提醒' visible={subscriptionDialog} footer={null} onClose={() => setSubscriptionDialog(false)}>
        <Text className='form-label'>邮箱</Text><Input className='form-input' value={email} placeholder='name@example.com' onInput={(event) => setEmail(event.detail.value)} />
        <Text className='form-label'>提醒阈值（元）</Text><Input className='form-input' type='digit' value={threshold} onInput={(event) => setThreshold(event.detail.value)} />
        <View className='dialog-actions'><Button className='secondary-button' onClick={() => void querySubscription()}>查询</Button><Button className='primary-button' onClick={() => void createSubscription()}>创建</Button></View>
      </Dialog>
    </PageShell>
  )
}
