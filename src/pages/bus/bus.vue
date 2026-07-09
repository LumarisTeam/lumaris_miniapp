<template>
  <view class="bus-page">
    <AppNavbar title="校车" show-back>
      <template #default>
        <view class="bus-page__nav-title">
          <LucideIcon name="bus" :size="20" color="var(--color-primary)" />
          <text class="bus-page__nav-title-text">校车</text>
        </view>
      </template>
    </AppNavbar>

    <template v-if="!userStore.isLogin">
      <EmptyState icon="bus" title="请先登录" description="登录后可查看校车时刻表" padding-top="200rpx" />
    </template>

    <template v-else>
      <view class="bus-page__date-tabs">
        <scroll-view scroll-x class="bus-page__dates">
          <view class="bus-page__dates-inner">
            <view
              v-for="date in dateOptions"
              :key="date.value"
              class="bus-page__date"
              :class="{ 'bus-page__date--active': currentDate === date.value }"
              @click="selectDate(date.value)"
            >
              <text class="bus-page__date-label">{{ date.label }}</text>
              <text class="bus-page__date-day">{{ date.day }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="bus-page__campus-tabs" v-if="campusOptions.length > 1">
        <scroll-view scroll-x class="bus-page__campus-scroll">
          <view class="bus-page__campus-inner">
            <view
              v-for="campus in campusOptions"
              :key="campus"
              class="bus-page__campus-chip"
              :class="{ 'bus-page__campus-chip--active': selectedCampus === campus }"
              @click="selectCampus(campus)"
            >
              <text class="bus-page__campus-label">{{ displayCampusName(campus) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <scroll-view scroll-y class="bus-page__scroll" v-if="!loading" :refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="onPullRefresh">
        <template v-if="busItems.length > 0">
          <view class="bus-page__section">
            <ClubCard padding="0">
              <view
                v-for="(item, idx) in busItems"
                :key="item.id || idx"
                class="bus-page__item"
                :class="{ 'bus-page__item--last': idx === busItems.length - 1 }"
                @click="showBusDetail(item)"
              >
                <view class="bus-page__item-time">
                  <LucideIcon name="clock" :size="16" color="var(--color-primary)" />
                  <text class="bus-page__item-hour">{{ item.departureTime }}</text>
                </view>
                <view class="bus-page__item-body">
                  <text class="bus-page__item-from">{{ item.departureStation }}</text>
                  <view class="bus-page__item-arrow">
                    <LucideIcon name="arrow-right" :size="16" color="var(--color-tertiary-label)" />
                  </view>
                  <text class="bus-page__item-to">{{ item.arrivalStation }}</text>
                </view>
                <view class="bus-page__item-trailing">
                  <text class="bus-page__item-campus">{{ item.campus }}</text>
                  <LucideIcon name="chevron-right" :size="14" color="var(--color-tertiary-label)" />
                </view>
              </view>
            </ClubCard>
          </view>
        </template>

        <template v-else>
          <EmptyState icon="bus" title="当天暂无校车" :padding-top="'120rpx'" />
        </template>
      </scroll-view>

      <LoadingState v-else text="加载中..." padding-top="120rpx" />
    </template>

    <view v-if="detailBus" class="bus-page__overlay" @click="detailBus = null">
      <view class="bus-page__detail" @click.stop>
        <view class="bus-page__detail-handle" />
        <view class="bus-page__detail-header">
          <text class="bus-page__detail-title">{{ detailBus.campus }}</text>
          <view class="bus-page__detail-close" @click="detailBus = null">
            <LucideIcon name="x" :size="18" color="var(--color-secondary-label)" />
          </view>
        </view>
        <view class="bus-page__detail-body">
          <view class="bus-page__detail-row">
            <LucideIcon name="clock" :size="16" color="var(--color-primary)" />
            <text class="bus-page__detail-label">出发时间</text>
            <text class="bus-page__detail-value">{{ detailBus.departureTime }}</text>
          </view>
          <view class="bus-page__detail-row">
            <LucideIcon name="map-pin" :size="16" color="var(--color-danger)" />
            <text class="bus-page__detail-label">出发站</text>
            <text class="bus-page__detail-value">{{ detailBus.departureStation }}</text>
          </view>
          <view class="bus-page__detail-row">
            <LucideIcon name="map-pin" :size="16" color="var(--color-success)" />
            <text class="bus-page__detail-label">到达站</text>
            <text class="bus-page__detail-value">{{ detailBus.arrivalStation }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { getBusData } from '@/api/modules/bus'
import type { BusItem } from '@/types'

const userStore = useUserStore()
const allBusItems = ref<BusItem[]>([])
const busItems = ref<BusItem[]>([])
const currentDate = ref('')
const selectedCampus = ref('')
const loading = ref(false)
const isRefreshing = ref(false)
const detailBus = ref<BusItem | null>(null)

const dateOptions = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return {
      value: ds,
      label: days[d.getDay()],
      day: `${d.getMonth() + 1}/${d.getDate()}`,
    }
  })
})

const campusOptions = computed(() => {
  const campuses = new Set<string>()
  allBusItems.value.forEach((item) => {
    if (item.departureStation) {
      campuses.add(item.departureStation)
    }
  })
  return Array.from(campuses)
})

function displayCampusName(campus: string): string {
  return campus.endsWith('校区') ? campus.slice(0, -2) : campus
}

function filterByCampus(items: BusItem[], campus: string): BusItem[] {
  if (!campus) return items
  return items.filter((item) => item.departureStation === campus)
}

async function fetchBusData(date: string) {
  loading.value = true
  try {
    const res = await getBusData(date)
    if (res.data) {
      allBusItems.value = res.data
      if (!selectedCampus.value || !campusOptions.value.includes(selectedCampus.value)) {
        selectedCampus.value = campusOptions.value.length > 0 ? campusOptions.value[0] : ''
      }
      busItems.value = filterByCampus(allBusItems.value, selectedCampus.value)
    }
  } catch (e) {
    console.error('Failed to fetch bus data:', e)
  } finally {
    loading.value = false
  }
}

function selectDate(date: string) {
  currentDate.value = date
  fetchBusData(date)
}

function selectCampus(campus: string) {
  if (selectedCampus.value === campus) return
  selectedCampus.value = campus
  busItems.value = filterByCampus(allBusItems.value, campus)
}

function showBusDetail(item: BusItem) {
  detailBus.value = item
}

async function onPullRefresh() {
  isRefreshing.value = true
  await fetchBusData(currentDate.value)
  isRefreshing.value = false
}

onMounted(() => {
  if (userStore.isLogin && dateOptions.value.length > 0) {
    selectDate(dateOptions.value[0].value)
  }
})
</script>

<style scoped>
.bus-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.bus-page__date-tabs {
  background-color: var(--color-app-bg);
  padding: 16rpx 0;
}

.bus-page__dates {
  white-space: nowrap;
}

.bus-page__dates-inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 32rpx;
}

.bus-page__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 32rpx;
  border-radius: var(--radius-sm);
  min-width: 100rpx;
  transition: all var(--transition-fast);
}

.bus-page__date--active {
  background-color: var(--color-primary-soft);
}

.bus-page__date-label {
  font-size: var(--font-xs);
  color: var(--color-secondary-label);
}

.bus-page__date--active .bus-page__date-label {
  color: var(--color-primary);
  font-weight: 600;
}

.bus-page__date-day {
  font-size: var(--font-xs);
  color: var(--color-tertiary-label);
  margin-top: 4rpx;
}

.bus-page__date--active .bus-page__date-day {
  color: var(--color-primary);
}

.bus-page__campus-tabs {
  background-color: var(--color-app-bg);
  padding: 0 0 16rpx;
}

.bus-page__campus-scroll {
  white-space: nowrap;
}

.bus-page__campus-inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 32rpx;
}

.bus-page__campus-chip {
  padding: 12rpx 28rpx;
  border-radius: var(--radius-pill);
  background-color: var(--color-surface-raised);
  border: 1rpx solid transparent;
  transition: all var(--transition-fast);
}

.bus-page__campus-chip--active {
  background-color: var(--color-primary);
}

.bus-page__campus-label {
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-secondary-label);
}

.bus-page__campus-chip--active .bus-page__campus-label {
  color: var(--color-on-accent);
  font-weight: 600;
}

.bus-page__scroll {
  height: calc(100vh - 280px - env(safe-area-inset-top));
}

.bus-page__section {
  padding: 32rpx;
}

.bus-page__item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
  gap: 24rpx;
  transition: opacity var(--transition-fast);
}

.bus-page__item:active {
  opacity: 0.6;
}

.bus-page__item--last {
  border-bottom: none;
}

.bus-page__nav-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.bus-page__nav-title-text {
  font-size: var(--font-title);
  font-weight: 600;
  color: var(--color-label);
}

.bus-page__item-time {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.bus-page__item-hour {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.bus-page__item-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.bus-page__item-from,
.bus-page__item-to {
  font-size: var(--font-caption);
  color: var(--color-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bus-page__item-arrow {
  flex-shrink: 0;
}

.bus-page__item-trailing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  flex-shrink: 0;
}

.bus-page__item-campus {
  font-size: var(--font-xs);
  color: var(--color-tertiary-label);
}

.bus-page__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.bus-page__detail {
  width: 100%;
  max-height: 60vh;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-xxl) var(--radius-xxl) 0 0;
  padding: 16rpx 32rpx 64rpx;
  animation: busSlideUp var(--transition-normal);
}

@keyframes busSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.bus-page__detail-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: var(--color-separator);
  margin: 0 auto 24rpx;
}

.bus-page__detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.bus-page__detail-title {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
  flex: 1;
}

.bus-page__detail-close {
  padding: 8rpx;
  flex-shrink: 0;
}

.bus-page__detail-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.bus-page__detail-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background-color: var(--color-surface-raised);
  border-radius: var(--radius-sm);
}

.bus-page__detail-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  flex-shrink: 0;
}

.bus-page__detail-value {
  font-size: var(--font-body-bold);
  color: var(--color-label);
  margin-left: auto;
}
</style>
