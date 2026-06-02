<template>
  <view class="home-exam-card">
    <view class="home-exam-card__header">
      <view class="home-exam-card__title-wrap">
        <LucideIcon name="notebook-pen" :size="20" color="var(--color-primary)" />
        <text class="home-exam-card__title">近期考试</text>
      </view>
      <view class="home-exam-card__refresh" @click="refresh">
        <LucideIcon name="refresh-cw" :size="18" color="var(--color-primary)" />
      </view>
    </view>

    <LoadingState v-if="examStore.loading && !examStore.loaded" padding-top="40rpx" text="加载考试中..." />

    <ErrorState
      v-else-if="examStore.error"
      padding-top="40rpx"
      title="考试数据加载失败"
      :message="examStore.error"
      retry-text="重新加载"
      @retry="refresh"
    />

    <EmptyState
      v-else-if="examStore.upcomingExams.length === 0"
      icon="notebook-pen"
      title="暂无近期考试"
      description="最近没有未结束的考试安排"
      padding-top="40rpx"
    />

    <ClubCard v-else padding="0" radius="var(--radius-sm)">
      <view
        v-for="(exam, index) in examStore.upcomingExams.slice(0, 5)"
        :key="`${exam.name}-${exam.time}-${index}`"
        class="home-exam-card__item"
        :class="{ 'home-exam-card__item--last': index === Math.min(examStore.upcomingExams.length, 5) - 1 }"
      >
        <view class="home-exam-card__item-main">
          <text class="home-exam-card__item-name">{{ exam.name }}</text>
          <text class="home-exam-card__item-meta">{{ exam.time }}</text>
          <text class="home-exam-card__item-meta">{{ buildLocation(exam) }}</text>
        </view>
        <LucideIcon name="chevron-right" :size="18" color="var(--color-tertiary-label)" />
      </view>
    </ClubCard>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useExamStore } from '@/stores/exam'

const props = defineProps<{
  studentId: string
}>()

const examStore = useExamStore()

function buildLocation(exam: { location: string; seat: string }) {
  if (exam.location && exam.seat) {
    return `${exam.location} | 座位 ${exam.seat}`
  }
  return exam.location || (exam.seat ? `座位 ${exam.seat}` : '地点待公布')
}

function refresh() {
  if (!props.studentId) return
  examStore.fetchExams(props.studentId)
}

watch(
  () => props.studentId,
  (studentId) => {
    if (studentId) {
      examStore.fetchExams(studentId, { silent: examStore.loaded })
    } else {
      examStore.clear()
    }
  },
  { immediate: true },
)

</script>

<style scoped>
.home-exam-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.home-exam-card__title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.home-exam-card__title {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
}

.home-exam-card__refresh {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
}

.home-exam-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
}

.home-exam-card__item--last {
  border-bottom: none;
}

.home-exam-card__item-main {
  min-width: 0;
  flex: 1;
}

.home-exam-card__item-name {
  display: block;
  font-size: var(--font-body-bold);
  color: var(--color-label);
}

.home-exam-card__item-meta {
  display: block;
  margin-top: 8rpx;
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  word-break: break-all;
}
</style>
