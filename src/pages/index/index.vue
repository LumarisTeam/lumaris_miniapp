<template>
  <view class="home-page">
    <AppNavbar title="光序">
      <template #actions>
        <view class="home-page__nav-action" @click="goLogin">
          <LucideIcon name="user" :size="22" color="var(--color-primary)" />
        </view>
      </template>
    </AppNavbar>

    <scroll-view scroll-y class="home-page__scroll">
      <!-- Today's Schedule Section -->
      <view class="home-page__section">
        <view class="home-page__section-header">
          <text class="home-page__section-title">今日课程</text>
          <text class="home-page__section-date">{{ todayDate }}</text>
        </view>

        <template v-if="!userStore.isLogin && !hasGuestCourses">
          <ClubCard padding="48rpx 32rpx">
            <view class="home-page__guest-hint">
              <LucideIcon name="log-in" :size="36" color="var(--color-secondary-label)" />
              <text class="home-page__guest-text">登录后查看课程表</text>
              <text class="home-page__guest-link" @click="goLogin">去登录</text>
            </view>
          </ClubCard>
        </template>

        <template v-else-if="todaySchedules.length === 0">
          <ClubCard padding="48rpx 32rpx">
            <view class="home-page__empty-schedule">
              <LucideIcon name="calendar-days" :size="36" color="var(--color-tertiary-label)" />
              <text class="home-page__empty-text">今天没有课程</text>
            </view>
          </ClubCard>
        </template>

        <template v-else>
          <CourseCard
            v-for="course in todaySchedules"
            :key="course.name"
            :name="course.name"
            :location="course.location"
            :teacher="course.teacher"
            :color="course.color || '#007AFF'"
            @click="showCourseDetail(course)"
          />
        </template>
      </view>

      <!-- Tiles Section -->
      <view class="home-page__section" v-if="visibleTiles.length > 0">
        <view class="home-page__section-header">
          <text class="home-page__section-title">校园服务</text>
        </view>
        <view class="home-page__tiles-grid">
          <TileCard
            v-for="tile in visibleTiles"
            :key="tile.type"
            :icon="getTileIcon(tile.type)"
            :icon-color="getTileColor(tile.type)"
            :icon-bg-color="getTileColor(tile.type) + '20'"
            :label="getTileLabel(tile.type)"
            :value="getTileValue(tile.type)"
            :color="getTileColor(tile.type)"
            class="home-page__tile"
            @click="goTilePage(tile.type)"
          />
        </view>
      </view>

      <view class="home-page__bottom" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import CourseCard from '@/components/schedule/CourseCard.vue'
import TileCard from '@/components/tiles/TileCard.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import { useSettingsStore } from '@/stores/settings'
import { getStorage, STORAGE_KEYS } from '@/utils/storage'
import type { Course, TileType } from '@/types'

const userStore = useUserStore()
const courseStore = useCourseStore()
const settingsStore = useSettingsStore()

const todayDate = computed(() => {
  const d = new Date()
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
})

const hasGuestCourses = computed(() => {
  const guest = getStorage<Course[]>(STORAGE_KEYS.GUEST_COURSE_DATA)
  return guest && guest.length > 0
})

const todaySchedules = computed(() => {
  const all = [
    ...courseStore.todayCourses,
    ...courseStore.customCourses.filter((c) => {
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      return c.dayOfWeek === dayOfWeek
    }),
  ]
  return all.sort((a, b) => a.startSlot - b.startSlot)
})

const visibleTiles = computed(() =>
  settingsStore.tiles.filter((t) => t.visible).sort((a, b) => a.order - b.order),
)

function getTileIcon(type: TileType): string {
  const map: Record<TileType, string> = {
    electricity: 'zap',
    bus: 'bus',
    payment: 'credit-card',
  }
  return map[type]
}

function getTileColor(type: TileType): string {
  const map: Record<TileType, string> = {
    electricity: '#FF9500',
    bus: '#5856D6',
    payment: '#34C759',
  }
  return map[type]
}

function getTileLabel(type: TileType): string {
  const map: Record<TileType, string> = {
    electricity: '电费',
    bus: '校车',
    payment: '饭卡',
  }
  return map[type]
}

function getTileValue(_type: TileType): string {
  return '点击查看'
}

function goTilePage(type: TileType) {
  const routes: Record<TileType, string> = {
    electricity: '/pages/electricity/electricity',
    bus: '/pages/bus/bus',
    payment: '/pages/payment/payment',
  }
  uni.navigateTo({ url: routes[type] })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function showCourseDetail(course: Course) {
  uni.showToast({ title: `${course.name}\n${course.location}`, icon: 'none' })
}

onMounted(() => {
  if (!userStore.isLogin) {
    courseStore.loadGuestCourses()
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.home-page__nav-action {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  transition: opacity var(--transition-fast);
}

.home-page__nav-action:active {
  opacity: 0.6;
}

.home-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.home-page__section {
  padding: 32rpx;
}

.home-page__section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.home-page__section-title {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
  letter-spacing: var(--letter-spacing-title);
}

.home-page__section-date {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.home-page__guest-hint,
.home-page__empty-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.home-page__guest-text,
.home-page__empty-text {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.home-page__guest-link {
  font-size: var(--font-body-bold);
  color: var(--color-primary);
  padding: 12rpx 32rpx;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
}

.home-page__tiles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.home-page__tile {
  aspect-ratio: 1;
}

.home-page__bottom {
  height: 120rpx;
}
</style>
