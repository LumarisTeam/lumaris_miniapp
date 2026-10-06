import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Map, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import type { MapPoi } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { getMapSnapshot } from '@/services/domainRepository'
import { describeError } from '@/utils/errorText'
import { useTranslation } from '@/i18n'
import { haptic } from '@/utils/platform'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 校园地图。
 *
 * 对应 Flutter 的 `lib/ui/pages/campus_map_page/campus_map_page.dart`：地图 +
 * 搜索 + 分类筛选 + 定位 + POI 详情。小程序用微信原生 Map 组件渲染，所以这里保留
 * 原生标记点而不是 Flutter 的自绘 marker。
 */

/** 拿不到定位时先落在学校所在的默认坐标，和 Flutter 的初始 center 一致。 */
const DEFAULT_LOCATION = { latitude: 34.2467, longitude: 108.9668 }

/** 小程序自定义标记点最多 100 个，超出部分只在列表里出现。 */
const MAX_MARKERS = 100
/** 列表一次只渲染这么多条，避免长列表阻塞地图交互。 */
const MAX_LIST_ITEMS = 20

/** 「全部分类」的内部哨兵值，避免用界面文案当筛选条件。 */
const ALL_CATEGORIES = ''

function matchesKeyword(poi: MapPoi, keyword: string): boolean {
  if (!keyword) return true
  return `${poi.name} ${poi.address} ${poi.description}`.toLowerCase().includes(keyword)
}

function CampusMapContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const [pois, setPois] = useState<MapPoi[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [selected, setSelected] = useState<MapPoi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [isStale, setIsStale] = useState(false)

  const locate = useCallback(async () => {
    haptic()
    try {
      const value = await Taro.getLocation({ type: 'gcj02' })
      setLocation({ latitude: value.latitude, longitude: value.longitude })
      setLocationError('')
    } catch {
      setLocationError(t('mapLocationDeniedRetry'))
      Taro.showToast({ title: t('mapLocateFailed'), icon: 'none' })
    }
  }, [t])

  useEffect(() => {
    const load = async () => {
      const [poiResult, locationResult] = await Promise.allSettled([
        getMapSnapshot(schoolCode, 'local-first'),
        Taro.getLocation({ type: 'gcj02' }),
      ])

      if (poiResult.status === 'fulfilled') {
        setPois(poiResult.value.data)
        setIsStale(poiResult.value.isStale)
        if (poiResult.value.isFromLocal) {
          try {
            const refreshed = await getMapSnapshot(schoolCode, 'refresh')
            setPois(refreshed.data)
            setIsStale(refreshed.isStale)
          } catch (refreshError) {
            setIsStale(true)
            if (poiResult.value.data.length === 0) {
              setError(refreshError instanceof Error ? refreshError.message : t('mapLoadFailed'))
            }
          }
        }
      } else {
        setError(poiResult.reason instanceof Error ? poiResult.reason.message : t('mapLoadFailed'))
      }

      if (locationResult.status === 'fulfilled') {
        setLocation({ latitude: locationResult.value.latitude, longitude: locationResult.value.longitude })
      } else {
        setLocationError(t('mapLocationDenied'))
      }
      setLoading(false)
    }
    void load()
  }, [schoolCode, t])

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(pois.map((poi) => poi.category).filter(Boolean))).sort()],
    [pois],
  )
  const categoryLabels = useMemo(
    () => categories.map((item) => (item === ALL_CATEGORIES ? t('allCategories') : item)),
    [categories, t],
  )
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return pois.filter((poi) => (category === ALL_CATEGORIES || poi.category === category) && matchesKeyword(poi, keyword))
  }, [pois, query, category])

  const activeCategoryIndex = Math.max(0, categories.indexOf(category))
  const markerPois = useMemo(() => filtered.slice(0, MAX_MARKERS), [filtered])
  const markers = useMemo(
    () => markerPois.map((poi, index) => ({
      id: index + 1,
      latitude: poi.latitude,
      longitude: poi.longitude,
      iconPath: logo,
      width: 28,
      height: 28,
    })),
    [markerPois],
  )

  // 地图接口需要登录态，Flutter 的 CampusMapPage 同样是未登录直接拦下。
  if (!session) {
    return (
      <PageShell title={t('campusMap')} showBack>
        <StateView
          state='login'
          title={t('guestMode')}
          description={t('guestModeSubtitle')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      title={t('campusMap')}
      showBack
      action={
        <View className='icon-action pressable' onClick={() => void locate()}>
          <AppIcon name='location' size={20} />
        </View>
      }
    >
      <View className='map-toolbar'>
        <View className='search-field grow'>
          <AppIcon name='search' size={18} color='var(--secondary-label)' />
          <Input value={query} placeholder={t('searchLocation')} onInput={(event) => setQuery(event.detail.value)} />
        </View>
        <Picker
          mode='selector'
          range={categoryLabels}
          value={activeCategoryIndex}
          onChange={(event) => setCategory(categories[Number(event.detail.value)] ?? ALL_CATEGORIES)}
        >
          <View className='map-category pressable'>
            <Text className='map-category__label'>{categoryLabels[activeCategoryIndex]}</Text>
          </View>
        </Picker>
      </View>

      {locationError ? <View className='page-note map-location-note'>{locationError}</View> : null}
      {isStale ? <View className='page-note map-location-note'>{t('refreshFailedFallback')}</View> : null}

      <Map
        className='campus-map'
        latitude={selected?.latitude ?? location.latitude}
        longitude={selected?.longitude ?? location.longitude}
        scale={16}
        showLocation
        markers={markers}
        onError={() => setError(t('mapLoadFailed'))}
        onMarkerTap={(event) => setSelected(markerPois[Number(event.detail.markerId) - 1] ?? null)}
      />

      {selected ? (
        <View className='map-results'>
          <ClubCard>
            <ListRow
              title={selected.name}
              subtitle={[selected.campus, selected.address, selected.description].filter(Boolean).join(' · ')}
              icon='location'
              value={selected.category}
            />
          </ClubCard>
        </View>
      ) : null}

      <View className='map-results'>
        <ClubCard padding='none'>
          {loading ? (
            <StateView state='loading' compact title={t('mapLoading')} />
          ) : error && pois.length === 0 ? (
            <StateView state='error' compact title={t('mapLoadFailed')} description={describeError(error, t)} />
          ) : filtered.length === 0 ? (
            <StateView state='empty' compact title={t('mapNoResults')} />
          ) : (
            filtered.slice(0, MAX_LIST_ITEMS).map((poi) => (
              <ListRow
                key={poi.id}
                title={poi.name}
                subtitle={[poi.campus, poi.address].filter(Boolean).join(' · ')}
                icon='location'
                value={poi.category}
                onClick={() => setSelected(poi)}
              />
            ))
          )}
        </ClubCard>
      </View>
    </PageShell>
  )
}

export default function CampusMapPage() {
  const t = useTranslation()
  return <FeatureGuard feature='map' title={t('campusMap')}><CampusMapContent /></FeatureGuard>
}
