<template>
  <view class="empty-state" :style="{ paddingTop: paddingTop }">
    <view class="empty-state__icon-wrapper">
      <LucideIcon :name="icon" :size="48" color="var(--color-tertiary-label)" />
    </view>
    <view class="empty-state__title">{{ title }}</view>
    <view v-if="description" class="empty-state__description">{{ description }}</view>
    <slot />
  </view>
</template>

<script setup lang="ts">
import LucideIcon from '../icons/LucideIcon.vue'

withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
    paddingTop?: string
  }>(),
  {
    icon: 'inbox',
    title: '',
    description: '',
    paddingTop: '120rpx',
  },
)
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state__icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.empty-state__title {
  font-size: var(--font-body-bold);
  color: var(--color-label);
  text-align: center;
}

.empty-state__description {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  text-align: center;
  margin-top: 8rpx;
  max-width: 500rpx;
}
</style>
