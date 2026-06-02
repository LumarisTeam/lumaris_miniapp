<template>
  <view
    class="club-list-tile"
    :class="{ 'club-list-tile--tappable': !!$attrs.onClick }"
    @click="handleClick"
  >
    <view v-if="$slots.leading" class="club-list-tile__leading">
      <slot name="leading" />
    </view>
    <view class="club-list-tile__body">
      <view class="club-list-tile__title">{{ title }}</view>
      <view v-if="subtitle" class="club-list-tile__subtitle">{{ subtitle }}</view>
    </view>
    <view v-if="$slots.trailing" class="club-list-tile__trailing">
      <slot name="trailing" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
  }>(),
  {
    subtitle: '',
  },
)

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.club-list-tile {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: var(--color-card-bg);
  min-height: 96rpx;
}

.club-list-tile--tappable {
  transition: opacity var(--transition-fast);
}

.club-list-tile--tappable:active {
  opacity: 0.6;
}

.club-list-tile__leading {
  margin-right: 24rpx;
  flex-shrink: 0;
}

.club-list-tile__body {
  flex: 1;
  min-width: 0;
}

.club-list-tile__title {
  font-size: var(--font-body);
  color: var(--color-label);
}

.club-list-tile__subtitle {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 4rpx;
}

.club-list-tile__trailing {
  margin-left: 24rpx;
  flex-shrink: 0;
}
</style>
