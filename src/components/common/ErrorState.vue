<template>
  <view class="error-state" :style="{ paddingTop: paddingTop }">
    <view class="error-state__icon-wrapper">
      <LucideIcon name="alert-circle" :size="48" color="var(--color-danger)" />
    </view>
    <view class="error-state__title">{{ title }}</view>
    <view v-if="message" class="error-state__message">{{ message }}</view>
    <view v-if="$slots.default" class="error-state__actions">
      <slot />
    </view>
    <view v-else-if="retryText" class="error-state__retry" @click="$emit('retry')">
      {{ retryText }}
    </view>
  </view>
</template>

<script setup lang="ts">
import LucideIcon from '../icons/LucideIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    retryText?: string
    paddingTop?: string
  }>(),
  {
    title: '加载失败',
    message: '',
    retryText: '重试',
    paddingTop: '120rpx',
  },
)

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-state__icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: var(--color-danger-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.error-state__title {
  font-size: var(--font-body-bold);
  color: var(--color-label);
  text-align: center;
}

.error-state__message {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  text-align: center;
  margin-top: 8rpx;
  max-width: 500rpx;
}

.error-state__retry {
  margin-top: 32rpx;
  padding: 16rpx 48rpx;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-on-accent);
  font-size: var(--font-body-bold);
  transition: opacity var(--transition-fast);
}

.error-state__retry:active {
  opacity: 0.7;
}
</style>
