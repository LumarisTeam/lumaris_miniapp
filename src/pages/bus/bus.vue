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

      <scroll-view scroll-y class="bus-page__scroll" v-if="!loading">
        <template v-if="busItems.length > 0">
          <view class="bus-page__section">
            <ClubCard padding="0">
              <view
                v-for="(item, idx) in busItems"
                :key="idx"
                class="bus-page__item"
                :class="{ 'bus-page__item--last': idx === busItems.length - 1 }"
              >
                <view class="bus-page__item-time">
                  <LucideIcon name="clock" :size="20" color="var(--color-primary)" />
                  <text class="bus-page__item-hour">{{ item.departureTime }}</text>
                </view>
                <view class="bus-page__item-body">
                  <text class="bus-page__item-from">{{ item.departureStation }}</text>
                  <view class="bus-page__item-arrow">
                    <LucideIcon name="arrow-left" :size="16" color="var(--color-tertiary-label)" />
                  </view>
                  <text class="bus-page__item-to">{{ item.arrivalStation }}</text>
                </view>
                <text class="bus-page__item-campus">{{ item.campus }}</text>
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
const busItems = ref<BusItem[]>([])
const currentDate = ref('')
const loading = ref(false)

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

async function fetchBusData(date: string) {
  loading.value = true
  try {
    const res = await getBusData(date)
    if (res.data) {
      busItems.value = res.data
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
  font-size: var(--font-caption);
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

.bus-page__scroll {
  height: calc(100vh - 200px - env(safe-area-inset-top));
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
  font-size: 32rpx;
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
  transform: rotate(180deg);
  flex-shrink: 0;
}

.bus-page__item-campus {
  font-size: var(--font-xs);
  color: var(--color-tertiary-label);
  flex-shrink: 0;
}
</style>
