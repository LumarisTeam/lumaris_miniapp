<template>
  <view class="electricity-page">
    <AppNavbar title="电费" show-back />

    <template v-if="!userStore.isLogin">
      <EmptyState icon="zap" title="请先登录" description="登录后可查看电费信息" padding-top="200rpx" />
    </template>

    <template v-else>
      <scroll-view scroll-y class="electricity-page__scroll">
        <!-- Balance Card -->
        <view class="electricity-page__section">
          <ClubCard>
            <view class="electricity-page__balance">
              <LucideIcon name="bolt-electric" :size="40" color="#FF9500" />
              <text class="electricity-page__balance-label">当前余额</text>
              <text class="electricity-page__balance-value">{{ balanceText }}</text>
              <view class="electricity-page__balance-actions">
                <view class="electricity-page__action-btn" @click="openRecharge">
                  <LucideIcon name="zap" :size="16" color="var(--color-on-accent)" />
                  <text>充值</text>
                </view>
              </view>
            </view>
          </ClubCard>
        </view>

        <!-- Weekly Chart -->
        <view class="electricity-page__section">
          <view class="electricity-page__section-title">本周用电</view>
          <ClubCard padding="24rpx">
            <view class="electricity-page__chart" v-if="chartData.series.length > 0">
              <qiun-data-charts
                type="line"
                :opts="chartOpts"
                :chartData="chartData"
                canvasId="electricity_chart"
                :canvas2d="true"
              />
            </view>
            <EmptyState
              v-else
              icon="inbox"
              title="暂无数据"
              :padding-top="'40rpx'"
              description=""
            />
          </ClubCard>
        </view>

        <view class="electricity-page__bottom" />
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { getElectricityBalance, getWeeklyData, getRechargeUrl } from '@/api/modules/electricity'
import type { ElectricDataPoint } from '@/types'

const userStore = useUserStore()
const balance = ref<number>(0)
const weeklyPoints = ref<ElectricDataPoint[]>([])
const rechargeUrl = ref('')

const balanceText = computed(() => {
  if (!balance.value) return '加载中...'
  return `¥ ${Number(balance.value).toFixed(2)}`
})

const chartData = computed<{ categories: string[]; series: { name: string; data: number[] }[] }>(() => {
  if (weeklyPoints.value.length === 0) return { categories: [], series: [] }
  const categories = weeklyPoints.value.map((p) => {
    const d = new Date(p.timestamp)
    return `${d.getHours()}:00`
  })
  const series = [
    {
      name: '用电量',
      data: weeklyPoints.value.map((p) => p.value),
    },
  ]
  return { categories, series }
})

const chartOpts = {
  color: ['#007AFF'],
  padding: [10, 10, 10, 20],
  dataLabel: false,
  dataPointShape: false,
  yAxis: {
    data: [],
    disabled: true,
  },
  xAxis: {
    disableGrid: true,
    labelCount: 5,
  },
  legend: { show: false },
}

async function openRecharge() {
  if (rechargeUrl.value) {
    uni.setClipboardData({
      data: rechargeUrl.value,
      success: () => {
        uni.showToast({ title: '充值链接已复制', icon: 'success' })
      },
    })
  } else {
    try {
      const res = await getRechargeUrl()
      if (res.data) {
        rechargeUrl.value = res.data
        uni.setClipboardData({
          data: res.data,
          success: () => {
            uni.showToast({ title: '充值链接已复制', icon: 'success' })
          },
        })
      }
    } catch (e) {
      uni.showToast({ title: '获取充值地址失败', icon: 'none' })
    }
  }
}

async function fetchData() {
  try {
    const [balRes, weekRes] = await Promise.all([getElectricityBalance(), getWeeklyData()])
    if (balRes.data !== undefined) {
      balance.value = Number(balRes.data)
    }
    if (weekRes.data) {
      weeklyPoints.value = weekRes.data
    }
  } catch (e) {
    console.error('Failed to fetch electricity data:', e)
  }
}

onMounted(() => {
  if (userStore.isLogin) {
    fetchData()
  }
})
</script>

<style scoped>
.electricity-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.electricity-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.electricity-page__section {
  padding: 32rpx;
}

.electricity-page__section-title {
  font-size: var(--font-section-title);
  font-weight: 700;
  color: var(--color-label);
  letter-spacing: var(--letter-spacing-title);
  margin-bottom: 24rpx;
}

.electricity-page__balance {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.electricity-page__balance-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
}

.electricity-page__balance-value {
  font-size: 72rpx;
  font-weight: bold;
  color: var(--color-label);
  margin: 16rpx 0;
  letter-spacing: var(--letter-spacing-title);
}

.electricity-page__balance-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
}

.electricity-page__action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 40rpx;
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-accent);
  font-size: var(--font-body-bold);
}

.electricity-page__chart {
  width: 100%;
  height: 400rpx;
}

.electricity-page__bottom {
  height: 60rpx;
}
</style>
