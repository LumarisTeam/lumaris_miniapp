import { useCallback, useEffect, useMemo, useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getBusSnapshot } from '@/services/domainRepository'
import type { BusTrip } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

function today(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function weeklyDates(): Array<{ value: string; label: string }> {
  const now = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index)
    const pad = (value: number) => String(value).padStart(2, '0')
    return { value: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, label: `${date.getMonth() + 1}月${date.getDate()}日` }
  })
}

function BusContent() {
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const [date, setDate] = useState(today())
  const [trips, setTrips] = useState<BusTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState('')
  const dates = useMemo(weeklyDates, [])

  const load = useCallback(async (targetDate = date, force = false) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const snapshot = await getBusSnapshot(targetDate, schoolCode, force ? 'refresh' : 'local-first')
      setTrips(snapshot.data); setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getBusSnapshot(targetDate, schoolCode, 'refresh')
        setTrips(refreshed.data); setIsStale(refreshed.isStale)
      }
    }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '校车信息加载失败') }
    finally { setLoading(false) }
  }, [date, session, schoolCode])

  useEffect(() => { void load(date) }, [date, load])
  usePullDownRefresh(() => { void load(date, true).finally(() => Taro.stopPullDownRefresh()) })
  const campusOptions = useMemo(() => Array.from(new Set(trips.map((trip) => trip.departureStation.trim()).filter(Boolean))), [trips])
  const activeCampus = campusOptions.includes(selectedCampus) ? selectedCampus : campusOptions[0] || ''
  const visibleTrips = trips.filter((trip) => trip.departureStation.trim() === activeCampus)

  return (
    <PageShell title='校车时刻' showBack action={<View className='icon-action pressable' onClick={() => void load()}><AppIcon name='refresh' size={20} /></View>}>
      {!session ? <StateView state='login' title='登录后查看校车时刻' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /> : (
        <>
          <View className='page-section'>
            <ClubCard>
              <Picker mode='selector' range={dates.map((item) => item.label)} value={Math.max(0, dates.findIndex((item) => item.value === date))} onChange={(event) => setDate(dates[Number(event.detail.value)]?.value || dates[0].value)}>
                <View className='bus-date pressable'><AppIcon name='calendar' size={20} color='var(--primary)' /><View><Text className='bus-date__label'>查询日期</Text><Text className='bus-date__value'>{dates.find((item) => item.value === date)?.label || date}</Text></View><AppIcon name='right' size={16} color='var(--tertiary-label)' /></View>
              </Picker>
              {campusOptions.length > 1 ? <Picker mode='selector' range={campusOptions} value={Math.max(0, campusOptions.indexOf(activeCampus))} onChange={(event) => setSelectedCampus(campusOptions[Number(event.detail.value)] || activeCampus)}><View className='bus-date pressable'><AppIcon name='location' size={20} color='var(--primary)' /><View><Text className='bus-date__label'>出发校区</Text><Text className='bus-date__value'>{activeCampus}</Text></View><AppIcon name='right' size={16} color='var(--tertiary-label)' /></View></Picker> : null}
            </ClubCard>
          </View>
          <View className='page-section'>
            {isStale ? <View className='page-note'>刷新失败，当前显示本地校车缓存</View> : null}
            <ClubCard padding='none'>
              {loading && trips.length === 0 ? <StateView state='loading' title='正在读取校车时刻' /> : error ? <StateView state='error' title='校车信息加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : visibleTrips.length === 0 ? <StateView state='empty' title='当天没有可用班次' description='可以切换其他日期查看' /> : visibleTrips.map((trip) => (
                <View className='bus-trip' key={trip.id} onClick={() => Taro.showModal({ title: trip.departureTime, content: `${trip.departureStation} → ${trip.arrivalStation}\n${trip.campus}`, showCancel: false })}>
                  <View className='bus-trip__time'>{trip.departureTime}</View>
                  <View className='bus-trip__line'><View className='bus-trip__dot' /><View className='bus-trip__rail' /></View>
                  <View className='grow'><Text className='bus-trip__route'>{trip.departureStation} → {trip.arrivalStation}</Text><Text className='bus-trip__campus'>{[trip.lineName, trip.description, trip.arrivalTime ? `预计 ${trip.arrivalTime} 到达` : ''].filter(Boolean).join(' · ') || '校车班次'}</Text></View>
                </View>
              ))}
            </ClubCard>
          </View>
        </>
      )}
    </PageShell>
  )
}

export default function BusPage() {
  return <FeatureGuard feature='bus_schedule' title='校车时刻'><BusContent /></FeatureGuard>
}
