import { useCallback, useEffect, useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { fetchBus } from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import type { BusTrip } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

function today(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export default function BusPage() {
  const session = useAuthStore((state) => state.session)
  const [date, setDate] = useState(today())
  const [trips, setTrips] = useState<BusTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (targetDate = date) => {
    if (!session) return
    setLoading(true)
    setError('')
    try { setTrips(await fetchBus(targetDate)) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '校车信息加载失败') }
    finally { setLoading(false) }
  }, [date, session])

  useEffect(() => { void load(date) }, [date, load])
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })

  return (
    <PageShell title='校车时刻' showBack action={<View className='icon-action pressable' onClick={() => void load()}><AppIcon name='refresh' size={20} /></View>}>
      {!session ? <StateView state='login' title='登录后查看校车时刻' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /> : (
        <>
          <View className='page-section'>
            <ClubCard>
              <Picker mode='date' value={date} onChange={(event) => setDate(String(event.detail.value))}>
                <View className='bus-date pressable'><AppIcon name='calendar' size={20} color='var(--primary)' /><View><Text className='bus-date__label'>查询日期</Text><Text className='bus-date__value'>{date}</Text></View><AppIcon name='right' size={16} color='var(--tertiary-label)' /></View>
              </Picker>
            </ClubCard>
          </View>
          <View className='page-section'>
            <ClubCard padding='none'>
              {loading && trips.length === 0 ? <StateView state='loading' title='正在读取校车时刻' /> : error ? <StateView state='error' title='校车信息加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : trips.length === 0 ? <StateView state='empty' title='当天没有可用班次' description='可以切换其他日期查看' /> : trips.map((trip) => (
                <View className='bus-trip' key={trip.id} onClick={() => Taro.showModal({ title: trip.departureTime, content: `${trip.departureStation} → ${trip.arrivalStation}\n${trip.campus}`, showCancel: false })}>
                  <View className='bus-trip__time'>{trip.departureTime}</View>
                  <View className='bus-trip__line'><View className='bus-trip__dot' /><View className='bus-trip__rail' /></View>
                  <View className='grow'><Text className='bus-trip__route'>{trip.departureStation} → {trip.arrivalStation}</Text><Text className='bus-trip__campus'>{trip.campus || '校车班次'}</Text></View>
                </View>
              ))}
            </ClubCard>
          </View>
        </>
      )}
    </PageShell>
  )
}
