<template>
  <view class="loading-state" :style="{ paddingTop: paddingTop }">
    <view class="loading-state__card">
      <view class="loading-state__spinner" />
      <view class="loading-state__text">{{ text }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    paddingTop?: string
  }>(),
  {
    text: '加载中...',
    paddingTop: '200rpx',
  },
)
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
}

.loading-state__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
  padding: 72rpx;
  border-radius: var(--radius-card);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-card);
}

.loading-state__spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6rpx solid var(--color-surface-sunken);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state__text {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}
</style>
