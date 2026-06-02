<template>
  <view class="map-page">
    <AppNavbar title="校园地图" show-back />
    <map
      class="map-page__map"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="15"
      :markers="markers"
      :show-location="true"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import { getMapData } from '@/api/modules/map'

const center = ref({ latitude: 34.233, longitude: 108.91 })

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
</style>
