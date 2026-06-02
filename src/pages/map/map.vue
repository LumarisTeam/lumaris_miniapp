<template>
  <view class="map-page">
    <AppNavbar title="校园地图" show-back />
    <map
      class="map-page__map"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="mapScale"
      :markers="markers"
      :show-location="true"
    />
    <view class="map-page__controls">
      <view class="map-page__zoom-btn" @click="zoomIn">
        <LucideIcon name="plus" :size="20" color="var(--color-primary)" />
      </view>
      <view class="map-page__zoom-divider" />
      <view class="map-page__zoom-btn" @click="zoomOut">
        <LucideIcon name="minus" :size="20" color="var(--color-primary)" />
      </view>
      <view class="map-page__locate-btn" @click="locateMe">
        <LucideIcon name="map-pin" :size="20" color="var(--color-primary)" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { getMapData } from '@/api/modules/map'

const center = ref({ latitude: 34.233, longitude: 108.91 })
const mapScale = ref(15)

const markers = ref<Array<{ id: number; latitude: number; longitude: number; title: string; callout: { content: string } }>>([])

async function fetchMapData() {
  try {
    const res = await getMapData()
    if (res.data) {
      markers.value = res.data
        .filter((p) => p.isActive)
        .map((p) => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.name,
          callout: { content: `${p.name}\n${p.description || p.address}` },
        }))
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
    console.error('Failed to fetch map data:', e)
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
    },
  })
}

onMounted(() => {
  uni.getLocation({
    type: 'gcj02',
    success: (loc) => {
      center.value = { latitude: loc.latitude, longitude: loc.longitude }
    },
  })
  fetchMapData()
})
</script>

<style scoped>
.map-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.map-page__map {
  width: 100%;
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.map-page__controls {
  position: absolute;
  right: 24rpx;
  bottom: 48rpx;
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
</style>
