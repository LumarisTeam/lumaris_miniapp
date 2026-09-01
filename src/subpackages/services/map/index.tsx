import { useEffect, useMemo, useState } from 'react'
import { Input, Map, Picker, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import type { MapPoi } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { getMapSnapshot } from '@/services/domainRepository'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

const DEFAULT_LOCATION = { latitude: 34.2467, longitude: 108.9668 }

function CampusMapContent() {
  const schoolCode = useAppStore((state) => state.school.code)
  const [pois, setPois] = useState<MapPoi[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [selected, setSelected] = useState<MapPoi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [poiResult, locationResult] = await Promise.allSettled([
        getMapSnapshot(schoolCode, 'local-first'),
        Taro.getLocation({ type: 'gcj02' }),
      ])
      if (poiResult.status === 'fulfilled') {
        setPois(poiResult.value.data); setIsStale(poiResult.value.isStale)
        if (poiResult.value.isFromLocal) {
          try {
            const refreshed = await getMapSnapshot(schoolCode, 'refresh')
            setPois(refreshed.data); setIsStale(refreshed.isStale)
          } catch (refreshError) {
            setIsStale(true)
            if (poiResult.value.data.length === 0) setError(refreshError instanceof Error ? refreshError.message : '地图数据加载失败')
          }
        }
      }
      else setError(poiResult.reason instanceof Error ? poiResult.reason.message : '地图数据加载失败')
      if (locationResult.status === 'fulfilled') setLocation({ latitude: locationResult.value.latitude, longitude: locationResult.value.longitude })
      else setLocationError('未获得定位权限，当前显示默认校区。点击右上角定位按钮可重试。')
      setLoading(false)
    }
    void load()
  }, [schoolCode])

  const categories = useMemo(() => ['全部', ...Array.from(new Set(pois.map((poi) => poi.category))).sort()], [pois])
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return pois.filter((poi) => (category === '全部' || poi.category === category) && (!keyword || `${poi.name} ${poi.address} ${poi.description}`.toLowerCase().includes(keyword)))
  }, [pois, query, category])
  const markerPois = filtered.slice(0, 100)
  const markers = markerPois.map((poi, index) => ({ id: index + 1, latitude: poi.latitude, longitude: poi.longitude, iconPath: logo, width: 28, height: 28 }))

  return (
    <PageShell title='校园地图' showBack action={<View className='icon-action pressable' onClick={() => void Taro.getLocation({ type: 'gcj02' }).then((value) => { setLocation({ latitude: value.latitude, longitude: value.longitude }); setLocationError('') }).catch(() => { setLocationError('未获得定位权限，请在微信设置中授权后重试。'); Taro.showToast({ title: '无法获取定位，请检查权限', icon: 'none' }) })}><AppIcon name='location' size={20} /></View>}>
      <View className='map-toolbar'>
        <View className='links-search grow'><AppIcon name='search' size={18} color='var(--secondary-label)' /><Input value={query} placeholder='搜索地点' onInput={(event) => setQuery(event.detail.value)} /></View>
        <Picker mode='selector' range={categories} value={Math.max(0, categories.indexOf(category))} onChange={(event) => setCategory(categories[Number(event.detail.value)] || '全部')}><View className='map-category pressable'>{category}</View></Picker>
      </View>
      {locationError ? <View className='page-note map-location-note'>{locationError}</View> : null}
      {isStale ? <View className='page-note map-location-note'>刷新失败，当前显示本地地图缓存</View> : null}
      <Map className='campus-map' latitude={selected?.latitude || location.latitude} longitude={selected?.longitude || location.longitude} scale={16} showLocation markers={markers} onError={() => setError('地图组件加载失败')} onMarkerTap={(event) => setSelected(markerPois[Number(event.detail.markerId) - 1] || null)} />
      {selected ? <View className='map-results'><ClubCard><ListRow title={selected.name} subtitle={[selected.campus, selected.address, selected.description].filter(Boolean).join(' · ')} icon='location' value={selected.category} /></ClubCard></View> : null}
      <View className='map-results'>
        <ClubCard padding='none'>
          {loading ? <StateView state='loading' compact title='正在加载校园地图' /> : error && pois.length === 0 ? <StateView state='error' compact title='地图数据加载失败' description={error} /> : filtered.length === 0 ? <StateView state='empty' compact title='没有匹配地点' /> : filtered.slice(0, 20).map((poi) => <ListRow key={poi.id} title={poi.name} subtitle={[poi.campus, poi.address].filter(Boolean).join(' · ')} icon='location' value={poi.category} onClick={() => setSelected(poi)} />)}
        </ClubCard>
      </View>
    </PageShell>
  )
}

export default function CampusMapPage() {
  return <FeatureGuard feature='map' title='校园地图'><CampusMapContent /></FeatureGuard>
}
