<template>
  <!-- <view class="week-selector">
    <view class="week-selector__nav">
      <view class="week-selector__arrow" @click="$emit('prev')">
        <LucideIcon name="chevron-left" :size="22" color="var(--color-primary)" />
      </view>
      <view class="week-selector__label" @click="showPicker = true">
        <text class="week-selector__label-text">{{ label }}</text>
        <LucideIcon name="chevron-right" :size="16" color="var(--color-secondary-label)" class="rotated" />
      </view>
      <view class="week-selector__arrow" @click="$emit('next')">
        <LucideIcon name="chevron-right" :size="22" color="var(--color-primary)" />
      </view>
    </view>
  </view> -->
  <wd-picker
    v-model="pickerValue"
    :columns="pickerColumns"
    title="选择周次"
    @confirm="handleConfirm"
    ref="pickerRef"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LucideIcon from '../icons/LucideIcon.vue'

const props = defineProps<{
  currentWeek: number
  totalWeeks: number
  label: string
}>()

const emit = defineEmits<{
  prev: []
  next: []
  select: [week: number]
}>()

const showPicker = ref(false)
const pickerValue = ref<number[]>([props.currentWeek])

const pickerColumns = computed(() => {
  return [
    Array.from({ length: props.totalWeeks }, (_, i) => ({
      label: `第 ${i + 1} 周`,
      value: i + 1,
    })),
  ]
})

function handleConfirm({ value }: { value: number[] }) {
  emit('select', value[0])
}
</script>

<style scoped>
.week-selector__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  padding: 16rpx 0;
}

.week-selector__arrow {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  transition: opacity var(--transition-fast);
}

.week-selector__arrow:active {
  opacity: 0.6;
}

.week-selector__label {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 32rpx;
  border-radius: var(--radius-sm);
  background-color: var(--color-card-bg);
}

.week-selector__label-text {
  font-size: var(--font-body-bold);
  color: var(--color-label);
}

.rotated {
  transform: rotate(90deg);
}
</style>
