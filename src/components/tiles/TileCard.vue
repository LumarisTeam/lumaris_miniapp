<template>
  <view class="tile-card-hitbox" hover-class="tile-card-hitbox--active" hover-stay-time="80" @tap="$emit('click')">
    <ClubCard class="tile-card" :style="tileStyle">
      <view class="tile-card__icon" :style="{ backgroundColor: iconBgColor }">
        <LucideIcon :name="icon" :size="22" :color="iconColor" />
      </view>
      <view class="tile-card__info">
        <text class="tile-card__label">{{ label }}</text>
        <text class="tile-card__value">{{ value }}</text>
      </view>
    </ClubCard>
  </view>
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
.tile-card-hitbox {
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.tile-card-hitbox--active {
  transform: scale(var(--press-scale));
  opacity: 0.92;
}

.tile-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 188rpx;
  padding: 28rpx 20rpx 24rpx;
  overflow: hidden;
  position: relative;
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
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tile-card__info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 20rpx;
}

.tile-card__label {
  font-size: 24rpx;
  color: var(--color-secondary-label);
  font-weight: 500;
  line-height: 1.2;
}

.tile-card__value {
  font-size: 26rpx;
  font-weight: bold;
  color: var(--color-label);
  line-height: 1.2;
}
</style>
