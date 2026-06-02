<template>
  <view class="app-navbar" :style="navbarStyle">
    <view class="app-navbar__back" v-if="showBack" @click="handleBack">
      <LucideIcon name="chevron-left" :size="24" color="var(--color-primary)" />
    </view>
    <view class="app-navbar__title">
      <slot>
        <text class="app-navbar__title-text">{{ title }}</text>
      </slot>
    </view>
    <view class="app-navbar__actions">
      <slot name="actions" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusBarHeight } from '@/utils/platform'
import LucideIcon from '../icons/LucideIcon.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    backgroundColor?: string
  }>(),
  {
    title: '',
    showBack: false,
    backgroundColor: 'var(--color-app-bg)',
  },
)

const statusBarHeight = getStatusBarHeight()
const navBarHeight = 88

const navbarStyle = computed(() => ({
  paddingTop: statusBarHeight + 'px',
  height: navBarHeight + 'px',
  backgroundColor: props.backgroundColor,
}))

function handleBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.app-navbar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.app-navbar__back {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8rpx;
  border-radius: var(--radius-sm);
  transition: opacity var(--transition-fast);
}

.app-navbar__back:active {
  opacity: 0.5;
}

.app-navbar__title {
  flex: 1;
  display: flex;
  align-items: center;
}

.app-navbar__title-text {
  font-size: var(--font-nav-title);
  font-weight: bold;
  color: var(--color-label);
  letter-spacing: var(--letter-spacing-title);
}

.app-navbar__actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}
</style>
