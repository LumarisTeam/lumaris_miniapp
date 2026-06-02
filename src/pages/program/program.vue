<template>
  <view class="program-page">
    <AppNavbar title="培养计划" show-back />

    <template v-if="!userStore.isLogin">
      <EmptyState icon="book-open" title="请先登录" description="登录后可查看培养计划" padding-top="200rpx" />
    </template>

    <template v-else>
      <scroll-view scroll-y class="program-page__scroll" v-if="!loading">
        <template v-if="planCourses.length > 0">
          <view class="program-page__section" v-for="(group, term) in groupedCourses" :key="term">
            <view class="program-page__term-title">
              <LucideIcon name="book-open" :size="18" color="var(--color-primary)" />
              <text>{{ term }}</text>
            </view>
            <ClubCard padding="0">
              <view
                v-for="(item, idx) in group"
                :key="idx"
                class="program-page__item"
                :class="{ 'program-page__item--last': idx === group.length - 1 }"
              >
                <view class="program-page__item-body">
                  <view class="program-page__item-name-row">
                    <LucideIcon name="clipboard" :size="16" color="var(--color-tertiary-label)" />
                    <text class="program-page__item-name">{{ item.name }}</text>
                  </view>
                  <text class="program-page__item-type">
                    {{ item.lessonType }} | {{ item.examMode }}
                  </text>
                </view>
                <view class="program-page__item-credit">
                  <text class="program-page__item-credit-value">{{ item.credits }}</text>
                  <text class="program-page__item-credit-label">学分</text>
                </view>
              </view>
            </ClubCard>
          </view>
        </template>

        <EmptyState v-else icon="book-open" title="暂无数据" :padding-top="'120rpx'" />
      </scroll-view>

      <LoadingState v-else text="加载中..." padding-top="120rpx" />
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { getProgram } from '@/api/modules/program'
import type { PlanCourse } from '@/types'

const userStore = useUserStore()
const planCourses = ref<PlanCourse[]>([])
const loading = ref(false)

const groupedCourses = computed(() => {
  const groups: Record<string, PlanCourse[]> = {}
  planCourses.value.forEach((c) => {
    const term = c.termStr || '其他'
    if (!groups[term]) groups[term] = []
    groups[term].push(c)
  })
  return groups
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getProgram(userStore.studentId, userStore.userData?.name || '')
    if (res.data) {
      planCourses.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch program:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (userStore.isLogin) {
    fetchData()
  }
})
</script>

<style scoped>
.program-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.program-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.program-page__section {
  padding: 32rpx;
}

.program-page__term-title {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
  letter-spacing: var(--letter-spacing-title);
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.program-page__item-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.program-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
}

.program-page__item--last {
  border-bottom: none;
}

.program-page__item-body {
  flex: 1;
  min-width: 0;
}

.program-page__item-name {
  font-size: var(--font-body);
  color: var(--color-label);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.program-page__item-type {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 4rpx;
  display: block;
}

.program-page__item-credit {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 24rpx;
  flex-shrink: 0;
}

.program-page__item-credit-value {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-primary);
}

.program-page__item-credit-label {
  font-size: var(--font-xs);
  color: var(--color-secondary-label);
}
</style>
