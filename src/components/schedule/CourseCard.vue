<template>
  <view class="course-card" :style="cardStyle" @click="$emit('click')">
    <view class="course-card__indicator" :style="{ backgroundColor: color }" />
    <view class="course-card__body">
      <view class="course-card__name">{{ name }}</view>
      <view class="course-card__meta">
        <view class="course-card__meta-item">
          <LucideIcon name="map-pin" :size="14" color="var(--color-secondary-label)" />
          <text>{{ location }}</text>
        </view>
        <view class="course-card__meta-item">
          <LucideIcon name="clock" :size="14" color="var(--color-secondary-label)" />
          <text>{{ teacher }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LucideIcon from '../icons/LucideIcon.vue'

const props = defineProps<{
  name: string
  location: string
  teacher: string
  color: string
}>()

defineEmits<{
  click: []
}>()

const cardStyle = computed(() => ({
  borderLeftColor: props.color,
}))
</script>

<style scoped>
.course-card {
  display: flex;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-sm);
  border-left: 8rpx solid;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: opacity var(--transition-fast);
}

.course-card:active {
  opacity: 0.7;
}

.course-card__indicator {
  display: none;
}

.course-card__body {
  flex: 1;
  min-width: 0;
}

.course-card__name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-label);
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.course-card__meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}
</style>
