<template>
  <view class="club-card" :style="cardStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    padding?: string
    margin?: string
    radius?: string
  }>(),
  {
    padding: '32rpx',
    margin: '0',
    radius: 'var(--radius-card)',
  },
)

const cardStyle = computed(() => ({
  padding: props.padding,
  margin: props.margin,
  borderRadius: props.radius,
}))
</script>

<style scoped>
.club-card {
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-card);
  border: 1rpx solid var(--color-separator);
}
</style>
