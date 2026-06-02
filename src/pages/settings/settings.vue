<template>
  <view class="settings-page">
    <AppNavbar title="设置" show-back />

    <scroll-view scroll-y class="settings-page__scroll">
      <!-- Appearance -->
      <view class="settings-page__section">
        <view class="settings-page__section-title">外观</view>
        <ClubCard padding="0">
          <ClubListTile title="深色模式" subtitle="跟随系统 / 浅色 / 深色">
            <template #leading>
              <LucideIcon name="moon" :size="20" color="var(--color-indigo)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <!-- Language -->
      <view class="settings-page__section">
        <view class="settings-page__section-title">语言</view>
        <ClubCard padding="0">
          <ClubListTile title="简体中文">
            <template #leading>
              <LucideIcon name="globe-lock" :size="20" color="var(--color-primary)" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <!-- Data -->
      <view class="settings-page__section">
        <view class="settings-page__section-title">数据</view>
        <ClubCard padding="0">
          <ClubListTile title="清除缓存" subtitle="清除所有本地数据" @click="clearCache">
            <template #leading>
              <LucideIcon name="trash" :size="20" color="var(--color-danger)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <!-- About -->
      <view class="settings-page__section">
        <view class="settings-page__section-title">关于</view>
        <ClubCard padding="0">
          <ClubListTile
            v-for="item in aboutItems"
            :key="item.name"
            :title="item.name"
            @click="navigateTo(item.route)"
          >
            <template #leading>
              <LucideIcon :name="item.icon" :size="20" color="var(--color-secondary-label)" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import ClubListTile from '@/components/common/ClubListTile.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { clearAll } from '@/utils/storage'

const aboutItems = [
  { name: '关于光序', icon: 'info', route: '/pages/about/about' },
  { name: '用户协议', icon: 'file-text', route: '/pages/about/about' },
  { name: '隐私政策', icon: 'shield-check', route: '/pages/about/about' },
  { name: '开源许可', icon: 'file-lock', route: '/pages/about/about' },
]

function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '将清除所有本地数据，包括登录信息',
    success: (res) => {
      if (res.confirm) {
        clearAll()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}

function navigateTo(route: string) {
  uni.navigateTo({ url: route })
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.settings-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.settings-page__section {
  padding: 0 32rpx 32rpx;
}

.settings-page__section-title {
  font-size: var(--font-caption-bold);
  color: var(--color-secondary-label);
  padding: 0 8rpx 16rpx;
}
</style>
