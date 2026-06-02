<template>
  <ClubCard class="tile-card" :style="tileStyle" @click="$emit('click')">
    <view class="tile-card__icon" :style="{ backgroundColor: iconBgColor }">
      <LucideIcon :name="icon" :size="24" :color="iconColor" />
    </view>
    <view class="tile-card__spacer" />
    <view class="tile-card__info">
      <text class="tile-card__label">{{ label }}</text>
      <text class="tile-card__value">{{ value }}</text>
    </view>
  </ClubCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClubCard from '../common/ClubCard.vue'
import LucideIcon from '../icons/LucideIcon.vue'

const props = defineProps<{
  icon: string
  iconColor: string
  iconBgColor: string
  label: string
  value: string
  color: string
}>()

defineEmits<{
  click: []
}>()

const tileStyle = computed(() => ({
  borderRadius: 'var(--radius-tile)',
}))
</script>

<style scoped>
.tile-card {
  display: flex;
  flex-direction: column;
  padding: 32rpx;
  transition: transform var(--transition-fast);
  overflow: hidden;
  position: relative;
}

.tile-card:active {
  transform: scale(var(--press-scale));
}

.tile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
}

.tile-card__icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tile-card__spacer {
  flex: 1;
}

.tile-card__info {
  display: flex;
  flex-direction: column;
  margin-top: 16rpx;
}

.tile-card__label {
  font-size: var(--font-tile-label);
  color: var(--color-secondary-label);
  font-weight: 500;
}

.tile-card__value {
  font-size: var(--font-tile-value);
  font-weight: bold;
  color: var(--color-label);
  letter-spacing: var(--letter-spacing-title);
  margin-top: 8rpx;
}
</style>
