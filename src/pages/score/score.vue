<template>
  <view class="score-page">
    <AppNavbar title="成绩">
      <template #actions>
        <view class="score-page__action" @click="refreshScores">
          <LucideIcon name="refresh-cw" :size="20" color="var(--color-primary)" />
        </view>
      </template>
    </AppNavbar>

    <template v-if="!userStore.isLogin">
      <EmptyState
        icon="graduation-cap"
        title="请先登录"
        description="登录后可查看成绩信息"
        padding-top="200rpx"
      >
        <view class="score-page__login-btn" @click="goLogin">去登录</view>
      </EmptyState>
    </template>

    <template v-else>
      <scroll-view scroll-y class="score-page__scroll">
        <!-- GPA Stats Card -->
        <view class="score-page__section">
          <ClubCard>
            <view class="score-page__stats">
              <view class="score-page__stat">
                <LucideIcon name="star-filled" :size="32" color="#FF9500" />
                <text class="score-page__stat-value">{{ gpa }}</text>
                <text class="score-page__stat-label">平均绩点</text>
              </view>
              <view class="score-page__stat">
                <LucideIcon name="book-open" :size="32" color="#007AFF" />
                <text class="score-page__stat-value">{{ totalCourses }}</text>
                <text class="score-page__stat-label">课程数</text>
              </view>
              <view class="score-page__stat">
                <LucideIcon name="graduation-cap" :size="32" color="#34C759" />
                <text class="score-page__stat-value">{{ totalCredits }}</text>
                <text class="score-page__stat-label">总学分</text>
              </view>
            </view>
          </ClubCard>
        </view>

        <!-- Semester Selector -->
        <view class="score-page__section">
          <scroll-view scroll-x class="score-page__semesters">
            <view class="score-page__semesters-inner">
              <view
                v-for="sem in semesters"
                :key="sem.value"
                class="score-page__semester"
                :class="{ 'score-page__semester--active': currentSemester === sem.value }"
                @click="selectSemester(sem.value)"
              >
                <text>{{ sem.text }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- Score List -->
        <view class="score-page__section" v-if="loading">
          <LoadingState :padding-top="'60rpx'" text="加载成绩中..." />
        </view>

        <view class="score-page__section" v-else-if="errorMessage">
          <ErrorState
            :padding-top="'60rpx'"
            title="成绩加载失败"
            :message="errorMessage"
            retry-text="重试"
            @retry="refreshScores"
          />
        </view>

        <view class="score-page__section" v-else-if="scores.length > 0">
          <ClubCard padding="0">
            <view
              v-for="(item, idx) in scores"
              :key="idx"
              class="score-page__item"
              :class="{ 'score-page__item--last': idx === scores.length - 1 }"
            >
              <view class="score-page__item-indicator" :style="getIndicatorStyle(item.gpa)" />
              <view class="score-page__item-body">
                <text class="score-page__item-name">{{ item.lessonName }}</text>
                <view class="score-page__item-meta">
                  <text class="score-page__item-code">{{ item.lessonCode }}</text>
                  <text class="score-page__item-credit">{{ item.credit }}学分</text>
                </view>
              </view>
              <view class="score-page__item-grade">
                <text class="score-page__item-score">{{ item.grade }}</text>
                <text class="score-page__item-gpa">绩点 {{ item.gpa }}</text>
              </view>
            </view>
          </ClubCard>
        </view>

        <view class="score-page__section" v-else>
          <EmptyState
            icon="inbox"
            title="暂无成绩"
            :padding-top="'60rpx'"
          />
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { getCurrentSemester, getSemesters, getScores } from '@/api/modules/score'
import type { ScoreItem, Semester } from '@/types'
import { toNumber } from '@/utils/education'

const userStore = useUserStore()
const scores = ref<ScoreItem[]>([])
const semesters = ref<Semester[]>([])
const currentSemester = ref('')
const loading = ref(false)
const errorMessage = ref('')

const gpa = computed(() => {
  if (scores.value.length === 0) return '--'
  const total = scores.value.reduce((sum, s) => sum + toNumber(s.gpa) * toNumber(s.credit), 0)
  const totalCredits = scores.value.reduce((sum, s) => sum + toNumber(s.credit), 0)
  return totalCredits > 0 ? (total / totalCredits).toFixed(2) : '--'
})

const totalCourses = computed(() => scores.value.length)

const totalCredits = computed(() =>
  scores.value.reduce((sum, s) => sum + toNumber(s.credit), 0).toFixed(0),
)

function getIndicatorStyle(rawGpa: number | string | null | undefined) {
  const value = toNumber(rawGpa)
  if (value >= 3.7) return { backgroundColor: '#34C759' }
  if (value >= 2.7) return { backgroundColor: '#007AFF' }
  if (value >= 1.7) return { backgroundColor: '#FF9500' }
  return { backgroundColor: '#FF3B30' }
}

async function fetchSemesters() {
  errorMessage.value = ''
  try {
    const [semesterRes, currentRes] = await Promise.allSettled([
      getSemesters(userStore.studentId),
      getCurrentSemester(),
    ])

    if (semesterRes.status === 'fulfilled' && semesterRes.value.data) {
      semesters.value = semesterRes.value.data
    } else {
      semesters.value = []
    }

    if (semesters.value.length === 0) {
      currentSemester.value = ''
      scores.value = []
      return
    }

    if (currentRes.status === 'fulfilled' && currentRes.value.data?.value) {
      currentSemester.value = currentRes.value.data.value
    } else {
      currentSemester.value = semesters.value[0].value
    }

    if (!semesters.value.some((semester) => semester.value === currentSemester.value)) {
      currentSemester.value = semesters.value[0].value
    }

    await fetchScores()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '获取学期失败'
  }
}

async function fetchScores() {
  if (!currentSemester.value) {
    scores.value = []
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getScores(userStore.studentId, currentSemester.value)
    scores.value = res.data ?? []
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '获取成绩失败'
    scores.value = []
  } finally {
    loading.value = false
  }
}

function selectSemester(value: string) {
  currentSemester.value = value
  fetchScores()
}

function refreshScores() {
  if (semesters.value.length === 0) {
    fetchSemesters()
  } else {
    fetchScores()
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

onShow(() => {
  if (userStore.isLogin) {
    fetchSemesters()
  }
})
</script>

<style scoped>
.score-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.score-page__action {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  transition: opacity var(--transition-fast);
}

.score-page__action:active {
  opacity: 0.6;
}

.score-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.score-page__section {
  padding: 32rpx 32rpx 0;
}

.score-page__stats {
  display: flex;
  justify-content: space-around;
}

.score-page__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.score-page__stat-value {
  font-size: 52rpx;
  font-weight: bold;
  color: var(--color-label);
}

.score-page__stat-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.score-page__semesters {
  white-space: nowrap;
}

.score-page__semesters-inner {
  display: inline-flex;
  gap: 16rpx;
}

.score-page__semester {
  padding: 16rpx 32rpx;
  border-radius: var(--radius-pill);
  background-color: var(--color-card-bg);
  font-size: var(--font-caption-bold);
  color: var(--color-secondary-label);
  transition: all var(--transition-fast);
}

.score-page__semester--active {
  background-color: var(--color-primary);
  color: var(--color-on-accent);
}

.score-page__login-btn {
  margin-top: 32rpx;
  padding: 20rpx 64rpx;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-on-accent);
  font-size: var(--font-body-bold);
}

.score-page__item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
}

.score-page__item--last {
  border-bottom: none;
}

.score-page__item-indicator {
  width: 8rpx;
  height: 56rpx;
  border-radius: var(--radius-indicator);
  margin-right: 24rpx;
  flex-shrink: 0;
}

.score-page__item-body {
  flex: 1;
  min-width: 0;
}

.score-page__item-name {
  font-size: var(--font-body-bold);
  color: var(--color-label);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-page__item-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 6rpx;
}

.score-page__item-code,
.score-page__item-credit {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.score-page__item-grade {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 24rpx;
  flex-shrink: 0;
}

.score-page__item-score {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--color-label);
}

.score-page__item-gpa {
  font-size: var(--font-xs);
  color: var(--color-secondary-label);
}

.score-page__bottom {
  height: 60rpx;
}
</style>
