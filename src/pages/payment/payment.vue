<template>
  <view class="payment-page">
    <AppNavbar title="饭卡" show-back />

    <template v-if="!userStore.isLogin">
      <EmptyState icon="credit-card" title="请先登录" description="登录后可查看消费记录" padding-top="200rpx" />
    </template>

    <template v-else>
      <!-- Balance Header -->
      <view class="payment-page__balance-card">
        <ClubCard>
          <view class="payment-page__balance">
            <LucideIcon name="credit-card" :size="40" color="var(--color-primary)" />
            <text class="payment-page__balance-label">卡内余额</text>
            <text class="payment-page__balance-value">¥ {{ balanceText }}</text>
          </view>
        </ClubCard>
      </view>

      <scroll-view scroll-y class="payment-page__scroll" v-if="!loading">
        <view class="payment-page__section" v-if="errorMessage">
          <ErrorState
            title="消费记录加载失败"
            :message="errorMessage"
            retry-text="重试"
            @retry="fetchData"
          />
        </view>

        <view class="payment-page__section" v-if="records.length > 0">
          <ClubCard padding="0">
            <view
              v-for="(item, idx) in records"
              :key="idx"
              class="payment-page__item"
              :class="{ 'payment-page__item--last': idx === records.length - 1 }"
            >
              <view class="payment-page__item-body">
                <text class="payment-page__item-name">{{ item.resume || '消费' }}</text>
                <text class="payment-page__item-date">{{ item.datetimeStr }}</text>
              </view>
              <text
                class="payment-page__item-amount"
                :class="{ 'payment-page__item-amount--positive': amountOf(item) > 0 }"
              >
                {{ amountOf(item) > 0 ? '+' : '' }}{{ amountOf(item).toFixed(2) }}
              </text>
            </view>
          </ClubCard>
        </view>

        <EmptyState v-else-if="!errorMessage" icon="credit-card" title="暂无消费记录" :padding-top="'120rpx'" />
      </scroll-view>

      <LoadingState v-else text="加载中..." padding-top="120rpx" />
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
import { getPaymentRecords } from '@/api/modules/payment'
import type { PaymentRecord } from '@/types'
import { toNumber } from '@/utils/education'

const userStore = useUserStore()
const records = ref<PaymentRecord[]>([])
const balance = ref(0)
const loading = ref(false)
const errorMessage = ref('')

const balanceText = computed(() => balance.value.toFixed(2))

function amountOf(record: PaymentRecord): number {
  return toNumber(record.tranamt)
}

async function fetchData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const studentId = userStore.studentId
    const res = await getPaymentRecords(studentId)
    records.value = res.data?.records ?? []
    balance.value = res.data?.balance ?? 0
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '获取消费记录失败'
    records.value = []
    balance.value = 0
  } finally {
    loading.value = false
  }
}

onShow(() => {
  if (userStore.isLogin) {
    fetchData()
  }
})
</script>

<style scoped>
.payment-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.payment-page__balance-card {
  padding: 32rpx;
}

.payment-page__balance {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.payment-page__balance-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 16rpx;
}

.payment-page__balance-value {
  font-size: 72rpx;
  font-weight: bold;
  color: var(--color-label);
  margin-top: 12rpx;
}

.payment-page__scroll {
  height: calc(100vh - 280px - env(safe-area-inset-top));
}

.payment-page__section {
  padding: 0 32rpx;
}

.payment-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
}

.payment-page__item--last {
  border-bottom: none;
}

.payment-page__item-body {
  flex: 1;
  min-width: 0;
}

.payment-page__item-name {
  font-size: var(--font-body);
  color: var(--color-label);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-page__item-date {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 4rpx;
  display: block;
}

.payment-page__item-amount {
  font-size: var(--font-body-bold);
  color: var(--color-danger);
  flex-shrink: 0;
  margin-left: 24rpx;
}

.payment-page__item-amount--positive {
  color: var(--color-success);
}
</style>
