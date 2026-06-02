<template>
  <view class="schedule-page">
    <AppNavbar title="课表">
      <template #default>
        <view class="schedule-page__nav-title">
          <LucideIcon name="calendar-days" :size="20" color="var(--color-primary)" />
          <text class="schedule-page__nav-title-text">课表</text>
        </view>
      </template>
    </AppNavbar>

    <WeekSelector
      :current-week="scheduleStore.currentWeek"
      :total-weeks="scheduleStore.totalWeeks"
      :label="scheduleStore.weekLabel"
      @prev="scheduleStore.prevWeek()"
      @next="scheduleStore.nextWeek()"
      @select="scheduleStore.setCurrentWeek"
    />

    <template v-if="!userStore.isLogin && allCourses.length === 0">
      <EmptyState
        icon="calendar-days"
        title="暂无课程数据"
        description="登录后可查看课程表，或导入自定义课程"
        padding-top="120rpx"
      />
    </template>

    <template v-else-if="allCourses.length === 0">
      <LoadingState padding-top="120rpx" text="加载课程中..." />
    </template>

    <template v-else>
      <ScheduleGrid
        :courses="allCourses"
        :current-week="scheduleStore.currentWeek"
        @course-click="showCourseDetail"
      />
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import WeekSelector from '@/components/schedule/WeekSelector.vue'
import ScheduleGrid from '@/components/schedule/ScheduleGrid.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import { useScheduleStore } from '@/stores/schedule'
import type { Course } from '@/types'

const userStore = useUserStore()
const courseStore = useCourseStore()
const scheduleStore = useScheduleStore()

const allCourses = computed(() => {
  return [...courseStore.visibleCourses, ...courseStore.customCourses]
})

function showCourseDetail(course: Course) {
  uni.showToast({
    title: `${course.name}\n${course.teacher} | ${course.location}`,
    icon: 'none',
  })
}

onMounted(() => {
  if (userStore.isLogin && courseStore.courses.length === 0) {
    courseStore.fetchCourses(userStore.studentId)
  } else if (!userStore.isLogin) {
    courseStore.loadGuestCourses()
  }
})
</script>

<style scoped>
.schedule-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.schedule-page__nav-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.schedule-page__nav-title-text {
  font-size: var(--font-title);
  font-weight: 600;
  color: var(--color-label);
}
</style>
