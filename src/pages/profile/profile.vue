<template>
  <view class="profile-page">
    <AppNavbar title="我的" />

    <scroll-view scroll-y class="profile-page__scroll">
      <!-- User Header -->
      <view class="profile-page__header">
        <template v-if="userStore.isLogin">
          <view class="profile-page__avatar">
            <LucideIcon name="user" :size="36" color="var(--color-on-accent)" />
          </view>
          <view class="profile-page__user-info">
            <text class="profile-page__username">{{ userStore.userData?.name || '同学' }}</text>
            <text class="profile-page__student-id">学号 {{ userStore.studentId }}</text>
          </view>
        </template>
        <template v-else>
          <view class="profile-page__avatar profile-page__avatar--ghost">
            <LucideIcon name="user" :size="36" color="var(--color-tertiary-label)" />
          </view>
          <view class="profile-page__user-info">
            <text class="profile-page__username">未登录</text>
            <text class="profile-page__login-link" @click="goLogin">点击登录</text>
          </view>
        </template>
      </view>

      <!-- Service Grid -->
      <view class="profile-page__section">
        <view class="profile-page__section-title">校园服务</view>
        <ClubCard padding="0">
          <view class="profile-page__grid">
            <view
              v-for="service in services"
              :key="service.name"
              class="profile-page__grid-item"
              @click="navigateTo(service.route)"
            >
              <view
                class="profile-page__grid-icon"
                :style="{ backgroundColor: service.color + '20' }"
              >
                <LucideIcon :name="service.icon" :size="28" :color="service.color" />
              </view>
              <text class="profile-page__grid-label">{{ service.name }}</text>
            </view>
          </view>
        </ClubCard>
      </view>

      <!-- Other Section -->
      <view class="profile-page__section">
        <view class="profile-page__section-title">其他</view>
        <ClubCard padding="0">
          <ClubListTile
            v-for="item in otherItems"
            :key="item.name"
            :title="item.name"
            @click="navigateTo(item.route)"
          >
            <template #leading>
              <LucideIcon :name="item.icon" :size="20" :color="item.color || 'var(--color-primary)'" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <!-- Storage Info -->
      <view class="profile-page__section">
        <ClubCard padding="0">
          <ClubListTile
            v-if="userStore.isLogin"
            title="退出登录"
            @click="handleLogout"
          >
            <template #leading>
              <LucideIcon name="log-out" :size="20" color="var(--color-danger)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <view class="profile-page__footer">
        <text class="profile-page__version">光序 v1.0.0</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import ClubListTile from '@/components/common/ClubListTile.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'

const userStore = useUserStore()
const courseStore = useCourseStore()

const services = [
  { name: '电费', icon: 'zap', route: '/pages/electricity/electricity', color: '#FF9500' },
  { name: '校车', icon: 'bus', route: '/pages/bus/bus', color: '#5856D6' },
  { name: '饭卡', icon: 'credit-card', route: '/pages/payment/payment', color: '#34C759' },
  { name: '校园地图', icon: 'map', route: '/pages/map/map', color: '#007AFF' },
  { name: '快速链接', icon: 'link', route: '/pages/link/link', color: '#007AFF' },
  { name: '培养计划', icon: 'book-open', route: '/pages/program/program', color: '#AF52DE' },
]

const otherItems = [
  { name: '设置', icon: 'settings', route: '/pages/settings/settings', color: '#8E8E93' },
  { name: '关于', icon: 'info', route: '/pages/about/about', color: '#8E8E93' },
]

function navigateTo(route: string) {
  uni.navigateTo({ url: route })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需重新登录',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        courseStore.clearAll()
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    },
  })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.profile-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.profile-page__header {
  display: flex;
  align-items: center;
  padding: 48rpx 32rpx;
  gap: 24rpx;
}

.profile-page__avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: var(--radius-tile);
  background: linear-gradient(135deg, var(--color-primary), var(--color-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-page__avatar--ghost {
  background: var(--color-surface-muted);
}

.profile-page__user-info {
  flex: 1;
}

.profile-page__username {
  font-size: var(--font-section-title);
  font-weight: bold;
  color: var(--color-label);
  display: block;
}

.profile-page__student-id {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 6rpx;
  display: block;
}

.profile-page__login-link {
  font-size: var(--font-body-bold);
  color: var(--color-primary);
  margin-top: 8rpx;
  display: inline-block;
}

.profile-page__section {
  padding: 0 32rpx 32rpx;
}

.profile-page__section-title {
  font-size: var(--font-caption-bold);
  color: var(--color-secondary-label);
  text-transform: uppercase;
  padding: 0 8rpx 16rpx;
}

.profile-page__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.profile-page__grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 16rpx;
  transition: opacity var(--transition-fast);
}

.profile-page__grid-item:active {
  opacity: 0.5;
}

.profile-page__grid-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: var(--radius-panel);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.profile-page__grid-label {
  font-size: var(--font-small-bold);
  color: var(--color-secondary-label);
}

.profile-page__footer {
  display: flex;
  justify-content: center;
  padding: 48rpx;
}

.profile-page__version {
  font-size: var(--font-caption);
  color: var(--color-tertiary-label);
}
</style>
