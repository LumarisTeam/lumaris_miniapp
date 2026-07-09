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
        <view class="schedule-grid__day-date" :class="{ 'schedule-grid__day-date--today': day.isToday }">
          <text class="schedule-grid__day-date-num">{{ day.dateNum }}</text>
        </view>
      </view>
    </view>
    <scroll-view scroll-y class="schedule-grid__body" :style="{ height: gridHeight }">
      <view class="schedule-grid__body-inner">
        <view class="schedule-grid__timeline">
          <view
            v-for="p in periodCount"
            :key="p"
            class="schedule-grid__period"
            :style="{ height: cellHeight + 'rpx' }"
          >
            <text class="schedule-grid__period-num">{{ p }}</text>
            <text v-if="slotTime(p).start" class="schedule-grid__period-time">{{ slotTime(p).start }}</text>
          </view>
        </view>
        <view class="schedule-grid__days">
          <view
            v-for="day in 7"
            :key="day"
            class="schedule-grid__day-col"
            :style="{ height: totalHeightRpx }"
          >
            <view
              v-for="p in periodCount"
              :key="'grid-' + p"
              class="schedule-grid__grid-cell"
              :style="{ top: (p - 1) * cellHeight + 'rpx', height: cellHeight + 'rpx' }"
            />
            <template v-for="(group, gi) in dayGroupsMap[day]" :key="'grp-' + gi">
              <view
                v-for="(course, ci) in group"
                :key="`${day}-${course.name}-${course.startSlot}-${ci}`"
                class="schedule-grid__course"
                :style="courseCardStyle(course, ci, group.length)"
                @click="$emit('courseClick', course)"
              >
                <text class="schedule-grid__course-name">{{ course.name }}</text>
                <text v-if="course.location" class="schedule-grid__course-location">{{ course.location }}</text>
                <text v-if="courseSpan(course) >= 3 && course.teacher" class="schedule-grid__course-teacher">{{ course.teacher }}</text>
              </view>
            </template>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'
import { getSlotTimeInfo } from '@/utils/education'
import { getSystemInfo, getStatusBarHeight, rpxToPx } from '@/utils/platform'

const props = withDefaults(
  defineProps<{
    courses: Course[]
    currentWeek: number
    weekStartDate: Date
    cellHeight?: number
    periodCount?: number
  }>(),
  {
    cellHeight: 110,
    periodCount: 12,
  },
)

defineEmits<{
  courseClick: [course: Course]
}>()

const campus = computed(() => {
  if (props.courses.length === 0) return undefined
  const first = props.courses.find((c) => c.campus) ?? props.courses[0]
  return first.campus === '草堂校区' || first.location.startsWith('草堂') ? '草堂校区' : undefined
})

const weekdays = computed(() => {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const today = new Date()
  const startOfWeek = new Date(props.weekStartDate)

  return labels.map((label, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    return {
      key: i + 1,
      label,
      dateNum: date.getDate(),
      isToday,
    }
  })
})

function slotTime(slot: number) {
  return getSlotTimeInfo(slot, campus.value)
}

const gridHeight = computed(() => {
  const info = getSystemInfo()
  const navHeight = getStatusBarHeight() + 44
  const weekSelectorHeight = rpxToPx(104)
  const headerHeight = rpxToPx(140)
  const extraPadding = rpxToPx(24)
  return `${info.windowHeight - navHeight - weekSelectorHeight - headerHeight - extraPadding}px`
})

const totalHeightRpx = computed(() => `${props.periodCount * props.cellHeight}rpx`)

function getDayCourses(day: number): Course[] {
  return props.courses
    .filter((c) => c.dayOfWeek === day && c.weeks.includes(props.currentWeek))
    .sort((a, b) => a.startSlot - b.startSlot)
}

function hasTimeConflict(a: Course, b: Course): boolean {
  return a.startSlot <= b.endSlot && a.endSlot >= b.startSlot
}

function groupConflictingCourses(courses: Course[]): Course[][] {
  const groups: Course[][] = []
  const used = new Array(courses.length).fill(false)

  for (let i = 0; i < courses.length; i++) {
    if (used[i]) continue
    const group = [courses[i]]
    used[i] = true
    for (let j = i + 1; j < courses.length; j++) {
      if (used[j]) continue
      if (hasTimeConflict(courses[i], courses[j])) {
        group.push(courses[j])
        used[j] = true
      }
    }
    groups.push(group)
  }
  return groups
}

const dayGroupsMap = computed<Record<number, Course[][]>>(() => {
  const map: Record<number, Course[][]> = {}
  for (let day = 1; day <= 7; day++) {
    map[day] = groupConflictingCourses(getDayCourses(day))
  }
  return map
})

function courseSpan(course: Course): number {
  return course.endSlot - course.startSlot + 1
}

function courseCardStyle(course: Course, index: number, groupSize: number): Record<string, string> {
  const top = (course.startSlot - 1) * props.cellHeight + 2
  const height = courseSpan(course) * props.cellHeight - 4
  const leftPercent = groupSize > 1 ? (index / groupSize) * 100 + 0.5 : 0.5
  const widthPercent = groupSize > 1 ? 100 / groupSize - 1 : 99

  return {
    top: `${top}rpx`,
    height: `${height}rpx`,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    backgroundColor: (course.color ?? '#007AFF') + 'E6',
  }
}
</script>

<style scoped>
.schedule-grid {
  background-color: var(--color-app-bg);
}

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
  padding: 16rpx 4rpx 20rpx;
}

.schedule-grid__day-name {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.schedule-grid__day-date {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8rpx;
}

.schedule-grid__day-date-num {
  font-size: var(--font-xs);
  color: var(--color-secondary-label);
}

.schedule-grid__day-date--today {
  background-color: var(--color-primary);
}

.schedule-grid__day-date--today .schedule-grid__day-date-num {
  color: var(--color-on-accent);
  font-weight: 600;
}

.schedule-grid__day-header--today .schedule-grid__day-name {
  color: var(--color-primary);
  font-weight: 600;
}

.schedule-grid__body {
  background-color: var(--color-app-bg);
}

.schedule-grid__body-inner {
  display: flex;
}

.schedule-grid__timeline {
  width: 100rpx;
  flex-shrink: 0;
  background-color: var(--color-card-bg);
}

.schedule-grid__period {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12rpx;
  border-bottom: 1rpx solid var(--color-separator);
  box-sizing: border-box;
}

.schedule-grid__period-num {
  font-size: var(--font-small-bold);
  font-weight: 600;
  color: var(--color-secondary-label);
}

.schedule-grid__period-time {
  font-size: 16rpx;
  color: var(--color-tertiary-label);
  margin-top: 4rpx;
}

.schedule-grid__days {
  flex: 1;
  display: flex;
}

.schedule-grid__day-col {
  flex: 1;
  position: relative;
  border-left: 1rpx solid var(--color-separator);
}

.schedule-grid__grid-cell {
  position: absolute;
  left: 0;
  width: 100%;
  border-bottom: 1rpx solid var(--color-separator);
}

.schedule-grid__course {
  position: absolute;
  border-radius: 8rpx;
  padding: 8rpx;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.schedule-grid__course-name {
  font-size: 20rpx;
  font-weight: 600;
  color: #ffffff;
  word-break: break-all;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.schedule-grid__course-location {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.85);
  word-break: break-all;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.schedule-grid__course-teacher {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
