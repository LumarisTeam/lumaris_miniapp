<template>
  <view class="map-page">
    <AppNavbar title="校园地图" show-back />
    <view class="map-page__body" :style="{ height: mapBodyHeight }">
      <map
        class="map-page__map"
        :latitude="center.latitude"
        :longitude="center.longitude"
        :scale="mapScale"
        :markers="markers"
        :show-location="true"
        @markertap="onMarkerTap"
      />

      <view v-if="loading" class="map-page__status">
        <LoadingState padding-top="0" text="正在加载校园地图..." />
      </view>

      <view v-else-if="errorMessage" class="map-page__status">
        <ErrorState
          padding-top="0"
          title="地图加载失败"
          :message="errorMessage"
          retry-text="重新加载"
          @retry="fetchMapData"
        />
      </view>

      <view v-else-if="markers.length === 0" class="map-page__status">
        <EmptyState
          padding-top="0"
          icon="map"
          title="暂无地图点位"
          description="暂时没有可显示的校园地点信息"
        />
      </view>

      <view v-if="!loading && filteredPOIs.length > 0" class="map-page__top-panel">
        <view class="map-page__search-row">
          <view class="map-page__search-box">
            <LucideIcon name="search" :size="16" color="var(--color-secondary-label)" />
            <input
              class="map-page__search-input"
              v-model="searchQuery"
              placeholder="搜索地点..."
              placeholder-class="map-page__search-placeholder"
            />
            <view v-if="searchQuery" class="map-page__search-clear" @click="searchQuery = ''">
              <LucideIcon name="x" :size="14" color="var(--color-secondary-label)" />
            </view>
          </view>
        </view>
        <scroll-view scroll-x class="map-page__chips">
          <view class="map-page__chips-inner">
            <view
              v-for="poi in filteredPOIs"
              :key="poi.id"
              class="map-page__chip"
              :class="{ 'map-page__chip--active': selectedPOI === poi }"
              @click="selectPOI(poi)"
            >
              <text class="map-page__chip-label">{{ poi.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="map-page__controls">
        <view class="map-page__zoom-btn" @click="zoomIn">
          <LucideIcon name="plus" :size="20" color="var(--color-primary)" />
        </view>
        <view class="map-page__zoom-divider" />
        <view class="map-page__zoom-btn" @click="zoomOut">
          <LucideIcon name="minus" :size="20" color="var(--color-primary)" />
        </view>
        <view class="map-page__locate-btn" @click="locateMe">
          <LucideIcon name="map-pin" :size="20" :color="userLocated ? 'var(--color-primary)' : 'var(--color-tertiary-label)'" />
        </view>
      </view>

      <view v-if="selectedPOI" class="map-page__detail-panel" @click.stop>
        <view class="map-page__detail-handle" />
        <view class="map-page__detail-header">
          <text class="map-page__detail-name">{{ selectedPOI.name }}</text>
          <view class="map-page__detail-close" @click="selectedPOI = null">
            <LucideIcon name="x" :size="18" color="var(--color-secondary-label)" />
          </view>
        </view>
        <view class="map-page__detail-body">
          <view class="map-page__detail-row">
            <LucideIcon name="info" :size="16" color="var(--color-secondary-label)" />
            <text class="map-page__detail-text">{{ selectedPOI.description || '暂无描述' }}</text>
          </view>
          <view class="map-page__detail-row">
            <LucideIcon name="map-pin" :size="16" color="var(--color-secondary-label)" />
            <text class="map-page__detail-text">
              {{ toNum(selectedPOI.latitude).toFixed(6) }}, {{ toNum(selectedPOI.longitude).toFixed(6) }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { getMapData } from '@/api/modules/map'
import { getStatusBarHeight } from '@/utils/platform'
import type { MapPoi } from '@/types'

const center = ref({ latitude: 34.233, longitude: 108.91 })
const mapScale = ref(15)
const loading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedPOIId = ref<number | null>(null)
const userLocated = ref(false)
const statusBarHeight = getStatusBarHeight()
const mapBodyHeight = computed(() => `${Math.max(360, uni.getSystemInfoSync().windowHeight - statusBarHeight - 88)}px`)

interface MarkerData {
  id: number
  latitude: number
  longitude: number
  title: string
  callout: { content: string }
}

const markers = ref<MarkerData[]>([])

const rawPOIs = ref<MapPoi[]>([])

const filteredPOIs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rawPOIs.value.filter((p) => p.isActive && (toNum(p.latitude) !== 0 || toNum(p.longitude) !== 0))
  return rawPOIs.value.filter((p) => {
    if (!p.isActive) return false
    const lat = toNum(p.latitude)
    const lng = toNum(p.longitude)
    if (lat === 0 && lng === 0) return false
    return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  })
})

const selectedPOI = computed(() => {
  if (selectedPOIId.value === null) return null
  return rawPOIs.value.find((p) => p.id === selectedPOIId.value) || null
})

function toNum(v: number | string | undefined | null): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.trim())
    if (Number.isFinite(n)) return n
  }
  return 0
}

function poiToMarker(p: MapPoi): MarkerData {
  return {
    id: p.id,
    latitude: toNum(p.latitude),
    longitude: toNum(p.longitude),
    title: p.name,
    callout: { content: `${p.name}\n${p.description || p.address}` },
  }
}

async function fetchMapData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getMapData()
    if (res.data) {
      rawPOIs.value = res.data
      markers.value = res.data
        .filter((p) => p.isActive)
        .map(poiToMarker)
        .filter((m) => m.latitude !== 0 || m.longitude !== 0)
      if (markers.value.length > 0) {
        const latSum = markers.value.reduce((s, m) => s + m.latitude, 0)
        const lngSum = markers.value.reduce((s, m) => s + m.longitude, 0)
        center.value = {
          latitude: latSum / markers.value.length,
          longitude: lngSum / markers.value.length,
        }
      }
    }
  } catch (e) {
    markers.value = []
    errorMessage.value = e instanceof Error ? e.message : '请稍后重试'
    console.error('Failed to fetch map data:', e)
  } finally {
    loading.value = false
  }
}

function onMarkerTap(e: { detail: { markerId: number } }) {
  selectedPOIId.value = e.detail.markerId
  const poi = rawPOIs.value.find((p) => p.id === e.detail.markerId)
  if (poi) {
    const lat = toNum(poi.latitude)
    const lng = toNum(poi.longitude)
    if (lat !== 0 || lng !== 0) {
      center.value = { latitude: lat, longitude: lng }
    }
  }
}

function selectPOI(poi: MapPoi) {
  selectedPOIId.value = poi.id
  const lat = toNum(poi.latitude)
  const lng = toNum(poi.longitude)
  if (lat !== 0 || lng !== 0) {
    center.value = { latitude: lat, longitude: lng }
  }
}

function zoomIn() {
  mapScale.value = Math.min(20, mapScale.value + 1)
}

function zoomOut() {
  mapScale.value = Math.max(3, mapScale.value - 1)
}

function locateMe() {
  uni.getLocation({
    type: 'gcj02',
    success: (loc) => {
      center.value = { latitude: loc.latitude, longitude: loc.longitude }
      userLocated.value = true
    },
    fail: () => {
      uni.showToast({ title: '获取位置失败', icon: 'none' })
    },
  })
}

onMounted(() => {
  uni.getLocation({
    type: 'gcj02',
    success: (loc) => {
      center.value = { latitude: loc.latitude, longitude: loc.longitude }
      userLocated.value = true
    },
  })
  fetchMapData()
})
</script>

<style scoped>
.map-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
  display: flex;
  flex-direction: column;
}

.map-page__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.map-page__map {
  width: 100%;
  height: 100%;
}

.map-page__status {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  top: 32rpx;
  z-index: 5;
}

.map-page__top-panel {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  right: 24rpx;
  z-index: 4;
  pointer-events: auto;
}

.map-page__search-row {
  margin-bottom: 16rpx;
}

.map-page__search-box {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 24rpx;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-sm);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  gap: 16rpx;
}

.map-page__search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: var(--color-label);
}

.map-page__search-placeholder {
  color: var(--color-tertiary-label);
  font-size: 28rpx;
}

.map-page__search-clear {
  padding: 8rpx;
}

.map-page__chips {
  white-space: nowrap;
}

.map-page__chips-inner {
  display: inline-flex;
  gap: 16rpx;
}

.map-page__chip {
  padding: 14rpx 32rpx;
  border-radius: var(--radius-pill);
  background-color: var(--color-card-bg);
  border: 1rpx solid var(--color-separator);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all var(--transition-fast);
}

.map-page__chip--active {
  background-color: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.map-page__chip-label {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--color-label);
}

.map-page__chip--active .map-page__chip-label {
  color: var(--color-primary);
  font-weight: 600;
}

.map-page__controls {
  position: absolute;
  right: 24rpx;
  bottom: 64rpx;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: var(--radius-sm);
  background-color: var(--color-card-bg);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.map-page__zoom-btn,
.map-page__locate-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--transition-fast);
}

.map-page__zoom-btn:active,
.map-page__locate-btn:active {
  opacity: 0.6;
}

.map-page__zoom-divider {
  height: 1rpx;
  background-color: var(--color-separator);
  margin: 0 16rpx;
}

.map-page__locate-btn {
  border-top: 1rpx solid var(--color-separator);
}

.map-page__detail-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-xxl) var(--radius-xxl) 0 0;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.08);
  padding: 16rpx 32rpx 64rpx;
  animation: mapSlideUp var(--transition-normal);
}

@keyframes mapSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.map-page__detail-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: var(--color-separator);
  margin: 0 auto 24rpx;
}

.map-page__detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.map-page__detail-name {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
  flex: 1;
}

.map-page__detail-close {
  padding: 8rpx;
  flex-shrink: 0;
}

.map-page__detail-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.map-page__detail-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background-color: var(--color-surface-raised);
  border-radius: var(--radius-sm);
}

.map-page__detail-text {
  font-size: var(--font-caption);
  color: var(--color-label);
  line-height: 1.5;
  flex: 1;
}
</style>
