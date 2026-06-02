<template>
  <view class="about-page">
    <AppNavbar title="关于" show-back />

    <scroll-view scroll-y class="about-page__scroll">
      <view class="about-page__header">
        <view class="about-page__logo">
          <LucideIcon name="graduation-cap" :size="52" color="var(--color-on-accent)" />
        </view>
        <text class="about-page__name">光序</text>
        <text class="about-page__version">版本 1.0.0</text>
        <text class="about-page__desc">校园服务小程序</text>
      </view>

      <view class="about-page__section">
        <ClubCard padding="0">
          <ClubListTile title="用户协议" @click="navigateTo('/pages/about/about')">
            <template #leading>
              <LucideIcon name="file-text" :size="20" color="var(--color-secondary-label)" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
          <ClubListTile title="隐私政策" @click="navigateTo('/pages/about/about')">
            <template #leading>
              <LucideIcon name="shield-check" :size="20" color="var(--color-secondary-label)" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
          <ClubListTile title="开源许可">
            <template #leading>
              <LucideIcon name="file-lock" :size="20" color="var(--color-secondary-label)" />
            </template>
            <template #trailing>
              <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
            </template>
          </ClubListTile>
        </ClubCard>
      </view>

      <view class="about-page__footer">
        <text class="about-page__copyright">西安建筑科技大学 iOS Club</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import ClubListTile from '@/components/common/ClubListTile.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'

function navigateTo(route: string) {
  // uni.navigateTo({ url: route })
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.about-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.about-page__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 0 48rpx;
}

.about-page__logo {
  width: 144rpx;
  height: 144rpx;
  border-radius: var(--radius-tile);
  background: linear-gradient(135deg, var(--color-primary), var(--color-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.about-page__name {
  font-size: var(--font-section-title);
  font-weight: bold;
  color: var(--color-label);
}

.about-page__version {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 8rpx;
}

.about-page__desc {
  font-size: var(--font-caption);
  color: var(--color-tertiary-label);
  margin-top: 4rpx;
}

.about-page__section {
  padding: 0 32rpx 32rpx;
}

.about-page__footer {
  display: flex;
  justify-content: center;
  padding: 48rpx;
}

.about-page__copyright {
  font-size: var(--font-caption);
  color: var(--color-tertiary-label);
}
</style>
