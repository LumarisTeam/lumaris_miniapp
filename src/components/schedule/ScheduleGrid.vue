<template>
  <view class="schedule-grid">
    <view class="schedule-grid__header">
      <view class="schedule-grid__corner" />
      <view
        v-for="day in weekdays"
        :key="day.key"
        class="schedule-grid__day-header"
        :class="{ 'schedule-grid__day-header--today': day.isToday }"
      >
        <text class="schedule-grid__day-name">{{ day.label }}</text>
        <text class="schedule-grid__day-date">{{ day.date }}</text>
      </view>
    </view>
    <scroll-view scroll-y class="schedule-grid__body" :style="{ height: gridHeight }">
      <view
        v-for="slot in timeSlots"
        :key="slot"
        class="schedule-grid__row"
      >
        <view class="schedule-grid__time-label">
          <text>{{ slot }}</text>
        </view>
        <view
          v-for="day in 7"
          :key="day"
          class="schedule-grid__cell"
        >
          <view
            v-for="course in getCoursesAtSlot(slot, day)"
            :key="course.name"
            class="schedule-grid__course"
            :style="{ backgroundColor: course.color + '20', borderLeftColor: course.color }"
            @click="$emit('courseClick', course)"
          >
            <text class="schedule-grid__course-name">{{ course.name }}</text>
            <text class="schedule-grid__course-location">{{ course.location }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'

const props = defineProps<{
  courses: Course[]
  currentWeek: number
}>()

defineEmits<{
  courseClick: [course: Course]
}>()

const weekdays = computed(() => {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const today = new Date()
  const currentDayOfWeek = today.getDay() || 7
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - currentDayOfWeek + 1)

  return labels.map((label, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    return {
      key: i + 1,
      label,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday: i + 1 === currentDayOfWeek,
    }
  })
})

const timeSlots = computed(() => {
  const slots = new Set<number>()
  props.courses.forEach((c) => {
    for (let i = c.startSlot; i <= c.endSlot; i++) {
      slots.add(i)
    }
  })
  return Array.from(slots).sort((a, b) => a - b)
})

const gridHeight = computed(() => {
  const info = uni.getSystemInfoSync()
  return `${info.windowHeight - 360}px`
})

function getCoursesAtSlot(slot: number, day: number): Course[] {
  return props.courses.filter(
    (c) =>
      c.dayOfWeek === day &&
      c.startSlot <= slot &&
      c.endSlot >= slot &&
      c.weeks.includes(props.currentWeek),
  )
}
</script>

<style scoped>
.schedule-grid__header {
  display: flex;
  background-color: var(--color-card-bg);
  border-bottom: 1rpx solid var(--color-separator);
}

.schedule-grid__corner {
  width: 100rpx;
  flex-shrink: 0;
}

.schedule-grid__day-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 4rpx;
}

.schedule-grid__day-name {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.schedule-grid__day-date {
  font-size: var(--font-xs);
  color: var(--color-tertiary-label);
  margin-top: 4rpx;
}

.schedule-grid__day-header--today .schedule-grid__day-name {
  color: var(--color-primary);
  font-weight: 600;
}

.schedule-grid__body {
  background-color: var(--color-app-bg);
}

.schedule-grid__row {
  display: flex;
  min-height: 100rpx;
  border-bottom: 1rpx solid var(--color-separator);
}

.schedule-grid__time-label {
  width: 100rpx;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12rpx;
  font-size: var(--font-xs);
  color: var(--color-secondary-label);
}

.schedule-grid__cell {
  flex: 1;
  padding: 4rpx;
  position: relative;
  border-left: 1rpx solid var(--color-separator);
}

.schedule-grid__course {
  padding: 8rpx;
  border-radius: 8rpx;
  border-left: 6rpx solid;
  margin-bottom: 4rpx;
  overflow: hidden;
}

.schedule-grid__course-name {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--color-label);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-grid__course-location {
  font-size: 18rpx;
  color: var(--color-secondary-label);
  display: block;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
