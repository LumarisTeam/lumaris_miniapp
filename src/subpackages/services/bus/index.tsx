import { useCallback, useEffect, useMemo, useState } from 'react'
import { Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import { DetailSheet, type DetailRow } from '@/components/common/DetailSheet'
import { SettingSheet, SettingSwitchRow } from '@/components/common/SettingSheet'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTileStore } from '@/stores/tile'
import { getBusSnapshot } from '@/services/domainRepository'
import { useTranslation, type Translator } from '@/i18n'
import { displayCampusName, splitArrivalDuration } from '@/utils/education'
import { describeError } from '@/utils/errorText'
import { MONTH_SHORT_KEYS, WEEKDAY_SHORT_KEYS, dateRange, toDateKey } from '@/utils/dates'
import type { BusTrip } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 校车时刻。
 *
 * 对应 Flutter 的 `lib/ui/pages/school_bus_page/school_bus_page.dart`：
 * 导航栏放校区切换（两个校区用分段控件，更多用下拉），下面一条可横滑的日期条，
 * 班次卡片显示出发/到达时刻与耗时，点击查看详情；右上角可刷新、可切换首页磁贴。
 */

/** 日期条覆盖今天起的一周，与 Flutter `_generateWeeklyDates` 一致。 */
const DAY_COUNT = 7

export function BusContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const tileConfig = useTileStore((state) => state.config)
  const toggleTile = useTileStore((state) => state.toggleVisibility)

  const days = useMemo(() => dateRange(new Date(), DAY_COUNT), [])
  const [dateKey, setDateKey] = useState(() => toDateKey(days[0]))
  const [trips, setTrips] = useState<BusTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState('')
  const [detailTrip, setDetailTrip] = useState<BusTrip | null>(null)
  const [settingsVisible, setSettingsVisible] = useState(false)

  const load = useCallback(async (targetDate = dateKey, force = false) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const snapshot = await getBusSnapshot(targetDate, schoolCode, force ? 'refresh' : 'local-first')
      setTrips(snapshot.data)
      setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getBusSnapshot(targetDate, schoolCode, 'refresh')
        setTrips(refreshed.data)
        setIsStale(refreshed.isStale)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [dateKey, schoolCode, session, t])

  useEffect(() => { void load(dateKey) }, [dateKey, load])
  usePullDownRefresh(() => { void load(dateKey, true).finally(() => Taro.stopPullDownRefresh()) })

  /** 出发校区按数据里出现的顺序，和 Flutter `_extractCampusOptions` 一样。 */
  const campusOptions = useMemo(() => {
    const seen: string[] = []
    for (const trip of trips) {
      const campus = trip.departureStation.trim()
      if (campus && !seen.includes(campus)) seen.push(campus)
    }
    return seen
  }, [trips])

  const activeCampus = campusOptions.includes(selectedCampus) ? selectedCampus : (campusOptions[0] ?? '')
  const visibleTrips = useMemo(
    () => trips.filter((trip) => trip.departureStation.trim() === activeCampus),
    [trips, activeCampus],
  )
  const busTileVisible = tileConfig.configurations.some((tile) => tile.id === 'bus' && tile.isVisible)

  const switcher = campusOptions.length === 1
    ? <Text className='bus-campus__single'>{displayCampusName(campusOptions[0])}</Text>
    : campusOptions.length > 1
      ? campusOptions.length === 2
        ? (
          <View className='segmented bus-campus__segmented'>
            {campusOptions.map((campus) => (
              <View
                key={campus}
                className={`segmented__item pressable ${campus === activeCampus ? 'segmented__item--active' : ''}`}
                onClick={() => setSelectedCampus(campus)}
              >
                {displayCampusName(campus)}
              </View>
            ))}
          </View>
        )
        : (
          <Picker
            mode='selector'
            range={campusOptions.map(displayCampusName)}
            value={Math.max(0, campusOptions.indexOf(activeCampus))}
            onChange={(event) => setSelectedCampus(campusOptions[Number(event.detail.value)] ?? activeCampus)}
          >
            <View className='bus-campus__picker pressable'>
              <Text className='bus-campus__picker-label'>{displayCampusName(activeCampus)}</Text>
              <AppIcon name='right' size={14} color='var(--secondary-label)' />
            </View>
          </Picker>
        )
      : null

  return (
    <PageShell
      // 校区切换放在导航栏里（两个校区用分段控件、更多用下拉），和 Flutter 一致；
      // 数据还没到时没有校区可选，这时退回页面标题。
      title={switcher ?? t('schoolBus')}
      showBack
      action={
        <>
          <View className='icon-action pressable' onClick={() => void load(dateKey, true)}>
            <AppIcon name='refresh' size={20} />
          </View>
          <View className='icon-action pressable' onClick={() => setSettingsVisible(true)}>
            <AppIcon name='settings' size={20} />
          </View>
        </>
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
          <ScrollView className='bus-dates' scrollX enableFlex>
            <View className='bus-dates__row'>
              {days.map((date, index) => {
                const key = toDateKey(date)
                const active = key === dateKey
                const previous = index > 0 ? days[index - 1] : null
                const showMonth = previous === null || previous.getMonth() !== date.getMonth()
                return (
                  <View
                    key={key}
                    className={`bus-day pressable ${active ? 'bus-day--active' : ''}`}
                    onClick={() => setDateKey(key)}
                  >
                    <Text className='bus-day__weekday'>{t(WEEKDAY_SHORT_KEYS[date.getDay()])}</Text>
                    <View className='bus-day__date'>
                      {showMonth ? <Text className='bus-day__month'>{t(MONTH_SHORT_KEYS[date.getMonth()])}</Text> : null}
                      <Text className='bus-day__number'>{date.getDate()}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </ScrollView>

          <View className='page-section'>
            {isStale ? <View className='page-note'>{t('busRefreshStale')}</View> : null}

            {loading && trips.length === 0 ? (
              <StateView state='loading' title={t('busLoading')} description={t('busLoadingSubtitle')} />
            ) : error && trips.length === 0 ? (
              <StateView
                state='error'
                title={t('loadFailed')}
                description={describeError(error, t)}
                actionLabel={t('retry')}
                onAction={() => void load(dateKey, true)}
              />
            ) : visibleTrips.length === 0 ? (
              <StateView state='empty' title={t('noBusToday')} description={t('noBusTodaySubtitle')} />
            ) : (
              <View className='stack'>
                {visibleTrips.map((trip) => (
                  <BusTripCard key={trip.id} trip={trip} onTap={() => setDetailTrip(trip)} />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <BusDetailSheet trip={detailTrip} visible={detailTrip !== null} onClose={() => setDetailTrip(null)} />

      <SettingSheet title={t('pageSettings')} visible={settingsVisible} onClose={() => setSettingsVisible(false)}>
        <SettingSwitchRow
          title={t('showBusTile')}
          subtitle={t('showBusTileSubtitle')}
          value={busTileVisible}
          onChange={() => toggleTile('bus')}
        />
      </SettingSheet>
    </PageShell>
  )
}

/** 班次卡片：出发/到达时刻 + 在途耗时 + 线路，对应 Flutter `BusTimelineTile`。 */
function BusTripCard({ trip, onTap }: { trip: BusTrip; onTap: () => void }) {
  const t = useTranslation()
  const duration = splitArrivalDuration(trip.arrivalStationTime)

  return (
    <ClubCard padding='compact' onClick={onTap}>
      <View className='bus-trip__head'>
        <View className='bus-trip__time'>
          <Text className='bus-trip__clock'>{trip.departureTime}</Text>
          <Text className='bus-trip__time-label'>{t('departure')}</Text>
        </View>
        <AppIcon name='right' size={16} color='var(--tertiary-label)' />
        <View className='bus-trip__time'>
          <Text className='bus-trip__clock'>{trip.arrivalTime || '--'}</Text>
          <Text className='bus-trip__time-label'>{t('arrival')}</Text>
        </View>
        {duration ? (
          <Text className='tag bus-trip__duration'>
            {t('arrivalStationTime', { h: duration.hours, m: duration.minutes })}
          </Text>
        ) : null}
      </View>

      <View className='bus-trip__body'>
        <View className='grow'>
          <Text className='bus-trip__route'>{`${trip.departureStation} → ${trip.arrivalStation}`}</Text>
          {trip.description ? <Text className='bus-trip__note'>{trip.description}</Text> : null}
        </View>
        <AppIcon name='right' size={16} color='var(--quaternary-label)' />
      </View>
    </ClubCard>
  )
}

/** 班次详情弹层，对应 Flutter `SchoolBusPage._showModalBottomSheet`。 */
export function busDetailRows(trip: BusTrip, t: Translator): DetailRow[] {
  return [
    { icon: 'clock', tone: 'primary', label: t('departureTime'), content: trip.departureTime },
    { icon: 'location', tone: 'danger', label: t('destination'), content: trip.arrivalStation },
    { icon: 'alarm', tone: 'success', label: t('estimatedArrival'), content: trip.arrivalTime },
    { icon: 'notice', tone: 'warning', label: t('busInfo'), content: trip.description },
  ]
}

function BusDetailSheet({ trip, visible, onClose }: { trip: BusTrip | null; visible: boolean; onClose: () => void }) {
  const t = useTranslation()
  if (!trip) return null
  return (
    <DetailSheet
      title={trip.lineName || `${trip.departureStation} → ${trip.arrivalStation}`}
      rows={busDetailRows(trip, t)}
      visible={visible}
      onClose={onClose}
    />
  )
}

export default function BusPage() {
  const t = useTranslation()
  return <FeatureGuard feature='bus_schedule' title={t('schoolBus')}><BusContent /></FeatureGuard>
}
