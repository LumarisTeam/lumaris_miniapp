<template>
  <view class="electricity-page">
    <AppNavbar title="电费" show-back>
      <template #actions>
        <view class="electricity-page__nav-action" @click="handleActionBtn">
          <LucideIcon
            :name="hasData ? 'refresh-cw' : 'plus'"
            :size="22"
            color="var(--color-primary)"
          />
        </view>
      </template>
    </AppNavbar>

    <template v-if="!userStore.isLogin">
      <EmptyState icon="log-in" title="请先登录" description="登录后可查看电费信息" padding-top="200rpx" />
    </template>

    <template v-else>
      <scroll-view
        scroll-y
        class="electricity-page__scroll"
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onPullRefresh"
      >
        <!-- Balance Header -->
        <view class="electricity-page__section">
          <ClubCard>
            <view class="electricity-page__balance">
              <text class="electricity-page__balance-label">当前余额</text>
              <view class="electricity-page__balance-row">
                <text class="electricity-page__balance-yen">¥</text>
                <text class="electricity-page__balance-value">{{ balanceDisplay }}</text>
              </view>
              <view
                class="electricity-page__status-badge"
                :class="statusBadgeClass"
              >
                <text>{{ statusBadgeText }}</text>
              </view>
            </view>
          </ClubCard>
        </view>

        <!-- Cost Statistics Card -->
        <view class="electricity-page__section" v-if="hasData">
          <view class="electricity-page__section-title">电费消耗</view>
          <ClubCard padding="48rpx 32rpx">
            <template v-if="isLoading && weeklyPoints.length === 0">
              <view class="electricity-page__loading">
                <text class="electricity-page__loading-text">加载中...</text>
              </view>
            </template>

            <template v-else-if="weeklyPoints.length === 0">
              <EmptyState
                icon="layout"
                title="暂无用电明细"
                description="获取数据后可查看消耗统计"
                :padding-top="'40rpx'"
              />
            </template>

            <template v-else>
              <!-- Header Row -->
              <view class="electricity-page__chart-header">
                <text class="electricity-page__chart-title">电费消耗</text>
                <view class="electricity-page__chart-badge">
                  <text>近{{ dailySummaries.length }}天</text>
                </view>
              </view>

              <!-- 2x2 Metrics Grid -->
              <view class="electricity-page__metrics">
                <view class="electricity-page__metric">
                  <text class="electricity-page__metric-label">总消耗</text>
                  <text class="electricity-page__metric-value">¥{{ totalCost.toFixed(2) }}</text>
                </view>
                <view class="electricity-page__metric-divider" />
                <view class="electricity-page__metric">
                  <text class="electricity-page__metric-label">今日</text>
                  <text class="electricity-page__metric-value">¥{{ todayCost.toFixed(2) }}</text>
                </view>
              </view>
              <view class="electricity-page__metrics-row-gap" />
              <view class="electricity-page__metrics">
                <view class="electricity-page__metric">
                  <text class="electricity-page__metric-label">日均</text>
                  <text class="electricity-page__metric-value">¥{{ averageDailyCost.toFixed(2) }}</text>
                </view>
                <view class="electricity-page__metric-divider" />
                <view class="electricity-page__metric">
                  <text class="electricity-page__metric-label">峰值</text>
                  <text class="electricity-page__metric-value">{{ peakLabel }}</text>
                </view>
              </view>

              <!-- Hourly Bar Chart -->
              <view class="electricity-page__hourly-section">
                <text class="electricity-page__hourly-title">逐时明细</text>
                <scroll-view scroll-x class="electricity-page__hourly-scroll">
                  <view class="electricity-page__hourly-bars">
                    <view
                      v-for="(item, idx) in recent24Hours"
                      :key="idx"
                      class="electricity-page__bar-col"
                    >
                      <text class="electricity-page__bar-value">{{ item.value.toFixed(1) }}</text>
                      <view class="electricity-page__bar-track">
                        <view
                          class="electricity-page__bar-fill"
                          :style="barFillStyle(item.value, maxHourlyValue)"
                        />
                      </view>
                      <text class="electricity-page__bar-hour">{{ getHourLabel(item) }}</text>
                    </view>
                  </view>
                </scroll-view>
              </view>
            </template>
          </ClubCard>
        </view>

        <!-- Settings Card -->
        <view class="electricity-page__section" v-if="hasData">
          <view class="electricity-page__section-title">设置</view>
          <ClubCard padding="0">
            <!-- Tile Toggle -->
            <view class="electricity-page__list-tile">
              <view class="electricity-page__list-tile-leading">
                <LucideIcon name="layout" :size="20" color="var(--color-primary)" />
              </view>
              <view class="electricity-page__list-tile-content">
                <text class="electricity-page__list-tile-title">添加到首页</text>
                <text class="electricity-page__list-tile-subtitle">在首页显示电费磁贴</text>
              </view>
              <switch
                class="electricity-page__list-tile-switch"
                :checked="isTileVisible"
                :color="switchColor"
                @change="toggleTile"
              />
            </view>
            <!-- Recharge -->
            <view class="electricity-page__list-tile" @click="handleRecharge">
              <view class="electricity-page__list-tile-leading">
                <LucideIcon name="credit-card" :size="20" color="var(--color-primary)" />
              </view>
              <view class="electricity-page__list-tile-content">
                <text class="electricity-page__list-tile-title">充值</text>
                <text class="electricity-page__list-tile-subtitle">跳转到电费充值页面</text>
              </view>
              <LucideIcon name="chevron-right" :size="16" color="var(--color-tertiary-label)" />
            </view>
          </ClubCard>
        </view>

        <!-- Low-Balance Subscription Card -->
        <view class="electricity-page__section" v-if="hasData">
          <view class="electricity-page__section-title">低余额提醒</view>
          <ClubCard padding="0">
            <!-- Header -->
            <view class="electricity-page__subscription-header">
              <view class="electricity-page__subscription-header-left">
                <text class="electricity-page__subscription-title">低余额提醒</text>
                <text class="electricity-page__subscription-desc">
                  {{ hasActiveSubscription ? '当电费余额低于阈值时将发送邮件提醒' : '设置邮箱提醒，避免余额不足断电' }}
                </text>
              </view>
              <view class="electricity-page__subscription-refresh" @click="loadSubscriptions(true)">
                <LucideIcon
                  name="refresh-cw"
                  :size="18"
                  :color="isSubscriptionLoading ? 'var(--color-tertiary-label)' : 'var(--color-primary)'"
                />
              </view>
            </view>

            <!-- Loading -->
            <view v-if="isSubscriptionLoading" class="electricity-page__subscription-loading">
              <text class="electricity-page__loading-text">加载订阅信息...</text>
            </view>

            <!-- No subscription: add button -->
            <view
              v-else-if="!hasActiveSubscription"
              class="electricity-page__list-tile"
              @click="showCreateDialog"
            >
              <view class="electricity-page__list-tile-leading">
                <LucideIcon name="bell" :size="20" color="var(--color-primary)" />
              </view>
              <view class="electricity-page__list-tile-content">
                <text class="electricity-page__list-tile-title">添加低余额提醒</text>
                <text class="electricity-page__list-tile-subtitle">{{ subscriptionSummary }}</text>
              </view>
              <LucideIcon name="plus" :size="18" color="var(--color-primary)" />
            </view>

            <!-- Active subscription: detail + delete -->
            <template v-else>
              <view class="electricity-page__list-tile" @click="showDetailDialog">
                <view class="electricity-page__list-tile-leading">
                  <LucideIcon name="check" :size="20" color="var(--color-primary)" />
                </view>
                <view class="electricity-page__list-tile-content">
                  <text class="electricity-page__list-tile-title">低余额提醒已开启</text>
                  <text class="electricity-page__list-tile-subtitle">{{ subscriptionSummary }}</text>
                </view>
                <LucideIcon name="chevron-right" :size="16" color="var(--color-tertiary-label)" />
              </view>
              <view class="electricity-page__list-tile" @click="showDeleteDialog">
                <view class="electricity-page__list-tile-leading">
                  <LucideIcon name="trash" :size="20" color="var(--color-error)" />
                </view>
                <view class="electricity-page__list-tile-content">
                  <text class="electricity-page__list-tile-title" style="color: var(--color-error);">删除订阅</text>
                  <text class="electricity-page__list-tile-subtitle">不再接收低余额提醒</text>
                </view>
                <LucideIcon name="chevron-right" :size="16" color="var(--color-tertiary-label)" />
              </view>
            </template>
          </ClubCard>
        </view>

        <view class="electricity-page__bottom" />
      </scroll-view>
    </template>

    <!-- Create Subscription Dialog -->
    <view v-if="showCreateSubDialog" class="electricity-page__overlay" @click="dismissDialogs">
      <view class="electricity-page__dialog" @click.stop>
        <text class="electricity-page__dialog-title">创建低余额提醒</text>
        <text class="electricity-page__dialog-desc">当电费余额低于设定阈值时，将通过邮件通知您</text>
        <input
          class="electricity-page__dialog-input"
          v-model="subEmail"
          placeholder="请输入邮箱地址"
          type="text"
        />
        <input
          class="electricity-page__dialog-input"
          v-model="subThreshold"
          placeholder="提醒阈值（元）"
          type="digit"
        />
        <view class="electricity-page__dialog-actions">
          <view class="electricity-page__dialog-btn electricity-page__dialog-btn--cancel" @click="dismissDialogs">
            <text>取消</text>
          </view>
          <view class="electricity-page__dialog-btn electricity-page__dialog-btn--confirm" @click="createSubscription">
            <text>创建</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Detail Dialog -->
    <view v-if="showDetailSubDialog" class="electricity-page__overlay" @click="dismissDialogs">
      <view class="electricity-page__dialog" @click.stop>
        <text class="electricity-page__dialog-title">低余额提醒</text>
        <view class="electricity-page__dialog-detail">
          <view class="electricity-page__dialog-detail-row">
            <text class="electricity-page__dialog-detail-label">提醒邮箱</text>
            <text class="electricity-page__dialog-detail-value">{{ subEmail || '未设置' }}</text>
          </view>
          <view class="electricity-page__dialog-detail-row">
            <text class="electricity-page__dialog-detail-label">提醒阈值</text>
            <text class="electricity-page__dialog-detail-value">{{ formatThreshold(subThresholdNum) }} 元</text>
          </view>
        </view>
        <view class="electricity-page__dialog-actions">
          <view class="electricity-page__dialog-btn electricity-page__dialog-btn--confirm" @click="dismissDialogs">
            <text>知道了</text>
          </view>
        </view>
      </view>
    </view>

    <!-- URL Input Dialog -->
    <view v-if="showUrlDialog" class="electricity-page__overlay" @click="dismissDialogs">
      <view class="electricity-page__dialog" @click.stop>
        <text class="electricity-page__dialog-title">获取电费数据</text>
        <text class="electricity-page__dialog-desc">请输入电费查询页面链接</text>
        <input
          class="electricity-page__dialog-input"
          v-model="urlInput"
          placeholder="https://..."
          type="text"
        />
        <view class="electricity-page__dialog-actions">
          <view class="electricity-page__dialog-btn electricity-page__dialog-btn--cancel" @click="dismissDialogs">
            <text>取消</text>
          </view>
          <view class="electricity-page__dialog-btn electricity-page__dialog-btn--confirm" @click="confirmUrlInput">
            <text>确认</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import {
  getElectricityBalance,
  getWeeklyData,
  getRechargeUrl,
  createSubscription as createSubApi,
  getSubscription as getSubApi,
  deleteSubscription as deleteSubApi,
} from '@/api/modules/electricity'
import { getStorage, setStorage, removeStorage, STORAGE_KEYS } from '@/utils/storage'
import type { ElectricDataPoint, ElectricitySubscriptionQueryResponse, TileConfig } from '@/types'

// ── Stores ──────────────────────────────────────────────
const userStore = useUserStore()
const settingsStore = useSettingsStore()

// ── Core Data ───────────────────────────────────────────
const balance = ref<number>(0)
const weeklyPoints = ref<ElectricDataPoint[]>([])
const hasData = ref(false)
const isLoading = ref(false)
const isRefreshing = ref(false)

// ── URL Cache ───────────────────────────────────────────
function getCachedUrl(): string {
  return getStorage<string>(STORAGE_KEYS.ELECTRICITY_URL) || ''
}
function setCachedUrl(url: string) {
  setStorage(STORAGE_KEYS.ELECTRICITY_URL, url)
}

// ── Computed: Balance ───────────────────────────────────
const balanceDisplay = computed(() => {
  if (!hasData.value) return '--'
  return balance.value.toFixed(2)
})

const statusBadgeText = computed(() => {
  if (!hasData.value) return '添加数据'
  return balance.value <= 10 ? '余额不足' : '余额充足'
})

const statusBadgeClass = computed(() => {
  if (!hasData.value) return 'electricity-page__status-badge--neutral'
  return balance.value <= 10
    ? 'electricity-page__status-badge--danger'
    : 'electricity-page__status-badge--success'
})

// ── Computed: Cost Statistics ───────────────────────────
function isSameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
}

interface DailySummary {
  date: Date
  cost: number
}

const dailySummaries = computed<DailySummary[]>(() => {
  const map = new Map<string, number>()
  for (const p of weeklyPoints.value) {
    const d = new Date(p.timestamp)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    map.set(key, (map.get(key) || 0) + p.value)
  }
  return Array.from(map.entries())
    .map(([key, cost]) => {
      const [y, m, d] = key.split('-').map(Number)
      return { date: new Date(y, m, d), cost }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

const totalCost = computed(() =>
  weeklyPoints.value.reduce((sum, p) => sum + p.value, 0),
)

const todayCost = computed(() => {
  const now = new Date()
  return weeklyPoints.value
    .filter((p) => isSameDay(new Date(p.timestamp), now))
    .reduce((sum, p) => sum + p.value, 0)
})

const averageDailyCost = computed(() => {
  if (dailySummaries.value.length === 0) return 0
  return totalCost.value / dailySummaries.value.length
})

const peakData = computed<ElectricDataPoint | null>(() => {
  if (weeklyPoints.value.length === 0) return null
  return weeklyPoints.value.reduce((peak, p) => (p.value > peak.value ? p : peak))
})

const peakLabel = computed(() => {
  if (!peakData.value) return '--'
  const d = new Date(peakData.value.timestamp)
  return `${d.getHours()}:00 / ¥${peakData.value.value.toFixed(1)}`
})

const recent24Hours = computed(() => {
  if (weeklyPoints.value.length <= 24) return weeklyPoints.value
  return weeklyPoints.value.slice(weeklyPoints.value.length - 24)
})

const maxHourlyValue = computed(() => {
  if (recent24Hours.value.length === 0) return 1
  return recent24Hours.value.reduce((max, p) => Math.max(max, p.value), 0)
})

function getHourLabel(item: ElectricDataPoint): string {
  return `${new Date(item.timestamp).getHours()}:00`
}

function barFillStyle(value: number, max: number) {
  const ratio = max <= 0 ? 0.05 : Math.max(0.05, value / max)
  return { height: `${(ratio * 160).toFixed(0)}rpx` }
}

// ── Settings ────────────────────────────────────────────
const switchColor = ref('#34C759')

const isTileVisible = computed(() => {
  const tile = settingsStore.tiles.find((t) => t.type === 'electricity')
  return tile ? tile.visible : true
})

function toggleTile() {
  const tiles: TileConfig[] = settingsStore.tiles.map((t) => ({ ...t }))
  const idx = tiles.findIndex((t) => t.type === 'electricity')
  if (idx >= 0) {
    tiles[idx] = { ...tiles[idx], visible: !tiles[idx].visible }
    settingsStore.updateTiles(tiles)
  }
}

// ── Recharge ────────────────────────────────────────────
async function handleRecharge() {
  try {
    const res = await getRechargeUrl(getCachedUrl() || undefined)
    if (res.data) {
      // In mini-program, copy URL to clipboard (can't open weixin:// directly)
      uni.setClipboardData({
        data: res.data,
        success: () => {
          uni.showToast({ title: '充值链接已复制，请在浏览器中打开', icon: 'success' })
        },
      })
    }
  } catch {
    uni.showToast({ title: '获取充值地址失败', icon: 'none' })
  }
}

// ── Subscriptions ───────────────────────────────────────
const showCreateSubDialog = ref(false)
const showDetailSubDialog = ref(false)
const showUrlDialog = ref(false)
const urlInput = ref('')
const subEmail = ref('')
const subThreshold = ref('10')
const subThresholdNum = ref<number | null>(null)
const isSubscriptionLoading = ref(false)
const hasLoadedSubscriptions = ref(false)
const hasActiveSubscription = ref(false)
const subscriptionId = ref('')
const subIdForDelete = ref('')

const subscriptionSummary = computed(() => {
  if (hasActiveSubscription.value && subEmail.value) {
    return `${subEmail.value} / ${formatThreshold(subThresholdNum.value)} 元`
  }
  return '点击设置提醒邮箱和阈值'
})

function formatThreshold(threshold: number | null): string {
  if (threshold === null || threshold === undefined) return '--'
  if (threshold === Math.round(threshold)) return threshold.toString()
  return threshold.toFixed(2)
}

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

async function restoreSubscriptionEmail() {
  const saved = getStorage<string>(STORAGE_KEYS.ELECTRICITY_SUBSCRIPTION_EMAIL) || ''
  subEmail.value = saved
}

async function saveSubscriptionEmail(email: string) {
  const trimmed = email.trim()
  if (trimmed) {
    setStorage(STORAGE_KEYS.ELECTRICITY_SUBSCRIPTION_EMAIL, trimmed)
  } else {
    removeStorage(STORAGE_KEYS.ELECTRICITY_SUBSCRIPTION_EMAIL)
  }
}

async function loadSubscriptions(force = false) {
  if (isSubscriptionLoading.value) return
  if (!force && hasLoadedSubscriptions.value) return

  isSubscriptionLoading.value = true
  try {
    const saved = getStorage<string>(STORAGE_KEYS.ELECTRICITY_SUBSCRIPTION_EMAIL) || ''
    if (saved) {
      const res = await getSubApi(saved)
      if (res.data) {
        hasActiveSubscription.value = res.data.hasSubscription
        subscriptionId.value = res.data.subscriptionId
        subThresholdNum.value = res.data.threshold
        subEmail.value = res.data.email || saved
      }
    }
    hasLoadedSubscriptions.value = true
  } catch {
    hasLoadedSubscriptions.value = true
  } finally {
    isSubscriptionLoading.value = false
  }
}

function showCreateDialog() {
  subEmail.value = getStorage<string>(STORAGE_KEYS.ELECTRICITY_SUBSCRIPTION_EMAIL) || ''
  if (!subThreshold.value || subThreshold.value === '0') {
    subThreshold.value = '10'
  }
  showCreateSubDialog.value = true
}

function showDetailDialog() {
  showDetailSubDialog.value = true
}

function showDeleteDialog() {
  uni.showModal({
    title: '删除订阅',
    content: '确定要删除低余额提醒订阅吗？删除后将不再接收提醒邮件。',
    confirmText: '删除',
    cancelText: '取消',
    confirmColor: '#FF3B30',
    success: async (res) => {
      if (res.confirm) {
        await doDeleteSubscription()
      }
    },
  })
}

function dismissDialogs() {
  showCreateSubDialog.value = false
  showDetailSubDialog.value = false
  showUrlDialog.value = false
}

async function createSubscription() {
  const email = subEmail.value.trim()
  const threshold = parseFloat(subThreshold.value.trim())

  if (!email) {
    uni.showToast({ title: '请输入邮箱地址', icon: 'none' })
    return
  }
  if (!isValidEmail(email)) {
    uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
    return
  }
  if (isNaN(threshold) || threshold <= 0) {
    uni.showToast({ title: '请输入有效的阈值金额', icon: 'none' })
    return
  }

  isSubscriptionLoading.value = true
  showCreateSubDialog.value = false
  try {
    await createSubApi({
      url: getCachedUrl(),
      email,
      threshold,
    })
    await saveSubscriptionEmail(email)
    hasActiveSubscription.value = true
    subThresholdNum.value = threshold
    hasLoadedSubscriptions.value = false
    await loadSubscriptions(true)
    uni.showToast({ title: '低余额提醒已创建', icon: 'success' })
  } catch {
    uni.showToast({ title: '创建订阅失败', icon: 'none' })
  } finally {
    isSubscriptionLoading.value = false
  }
}

async function doDeleteSubscription() {
  if (!subscriptionId.value) {
    uni.showToast({ title: '没有可删除的订阅', icon: 'none' })
    return
  }
  isSubscriptionLoading.value = true
  try {
    await deleteSubApi(subscriptionId.value)
    hasActiveSubscription.value = false
    subscriptionId.value = ''
    subThresholdNum.value = null
    hasLoadedSubscriptions.value = false
    await loadSubscriptions(true)
    uni.showToast({ title: '低余额提醒已删除', icon: 'success' })
  } catch {
    uni.showToast({ title: '删除订阅失败', icon: 'none' })
  } finally {
    isSubscriptionLoading.value = false
  }
}

// ── URL Input Dialog ────────────────────────────────────
async function confirmUrlInput() {
  const url = urlInput.value.trim()
  if (!url) {
    uni.showToast({ title: '请输入链接', icon: 'none' })
    return
  }
  setCachedUrl(url)
  showUrlDialog.value = false
  urlInput.value = ''
  await fetchData()
}

// ── Data Fetching ───────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  try {
    const cachedUrl = getCachedUrl()
    const urlParam = cachedUrl || undefined
    const [balRes, weekRes] = await Promise.all([
      getElectricityBalance(urlParam),
      getWeeklyData(urlParam),
    ])
    if (balRes.data !== undefined && balRes.data !== null) {
      balance.value = Number(balRes.data)
      hasData.value = true
    }
    if (weekRes.data) {
      weeklyPoints.value = weekRes.data
    }
  } catch {
    // Keep last known data on transient failure
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  try {
    const cachedUrl = getCachedUrl()
    const urlParam = cachedUrl || undefined
    const [balRes, weekRes] = await Promise.all([
      getElectricityBalance(urlParam),
      getWeeklyData(urlParam),
    ])
    if (balRes.data !== undefined && balRes.data !== null) {
      balance.value = Number(balRes.data)
      hasData.value = true
    }
    if (weekRes.data) {
      weeklyPoints.value = weekRes.data
    }
    if (hasData.value && !hasLoadedSubscriptions.value) {
      await loadSubscriptions(true)
    }
  } catch {
    // Keep last known data
  }
}

async function onPullRefresh() {
  isRefreshing.value = true
  await refreshData()
  isRefreshing.value = false
}

// ── Action Button (Navbar) ──────────────────────────────
function handleActionBtn() {
  if (hasData.value) {
    uni.showActionSheet({
      itemList: ['刷新数据', '更改链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          refreshData()
        } else if (res.tapIndex === 1) {
          showUrlDialog.value = true
        }
      },
    })
  } else {
    showUrlDialog.value = true
  }
}

// ── Lifecycle ───────────────────────────────────────────
onMounted(async () => {
  if (userStore.isLogin) {
    await restoreSubscriptionEmail()
    await fetchData()
    if (hasData.value) {
      await loadSubscriptions()
    }
  }
})
</script>

<style scoped>
/* ── Page Layout ──────────────────────────────────────── */
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

.electricity-page__bottom {
  height: 60rpx;
}

.electricity-page__nav-action {
  padding: 8rpx 16rpx;
}

/* ── Balance Header ───────────────────────────────────── */
.electricity-page__balance {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}

.electricity-page__balance-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-bottom: 8rpx;
}

.electricity-page__balance-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.electricity-page__balance-yen {
  font-size: 48rpx;
  font-weight: 600;
  color: var(--color-label);
  margin-right: 8rpx;
  margin-top: 8rpx;
}

.electricity-page__balance-value {
  font-size: 112rpx;
  font-weight: 700;
  color: var(--color-label);
  letter-spacing: -2rpx;
  line-height: 1.1;
}

.electricity-page__status-badge {
  margin-top: 24rpx;
  padding: 12rpx 32rpx;
  border-radius: var(--radius-pill);
}

.electricity-page__status-badge text {
  font-size: 26rpx;
  font-weight: 600;
}

.electricity-page__status-badge--danger {
  background-color: rgba(255, 59, 48, 0.1);
}
.electricity-page__status-badge--danger text {
  color: #FF3B30;
}

.electricity-page__status-badge--success {
  background-color: rgba(52, 199, 89, 0.1);
}
.electricity-page__status-badge--success text {
  color: #34C759;
}

.electricity-page__status-badge--neutral {
  background-color: var(--color-surface-muted);
}
.electricity-page__status-badge--neutral text {
  color: var(--color-secondary-label);
}

/* ── Chart Header ─────────────────────────────────────── */
.electricity-page__chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.electricity-page__chart-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--color-label);
}

.electricity-page__chart-badge {
  padding: 8rpx 20rpx;
  background-color: var(--color-surface-muted);
  border-radius: var(--radius-small);
}

.electricity-page__chart-badge text {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--color-secondary-label);
}

/* ── Metrics Grid ─────────────────────────────────────── */
.electricity-page__metrics {
  display: flex;
  align-items: flex-start;
}

.electricity-page__metrics-row-gap {
  height: 40rpx;
}

.electricity-page__metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.electricity-page__metric-label {
  font-size: 26rpx;
  color: var(--color-secondary-label);
  font-weight: 500;
  margin-bottom: 12rpx;
}

.electricity-page__metric-value {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--color-label);
  letter-spacing: -0.5rpx;
}

.electricity-page__metric-divider {
  width: 1rpx;
  height: 80rpx;
  background-color: var(--color-separator);
}

/* ── Hourly Bar Chart ─────────────────────────────────── */
.electricity-page__hourly-section {
  margin-top: 48rpx;
}

.electricity-page__hourly-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-label);
  margin-bottom: 24rpx;
}

.electricity-page__hourly-scroll {
  width: 100%;
}

.electricity-page__hourly-bars {
  display: flex;
  align-items: flex-end;
  padding-bottom: 8rpx;
}

.electricity-page__bar-col {
  width: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.electricity-page__bar-value {
  font-size: 22rpx;
  font-weight: 600;
  color: var(--color-secondary-label);
  margin-bottom: 12rpx;
}

.electricity-page__bar-track {
  width: 24rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background-color: var(--color-surface-muted);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.electricity-page__bar-fill {
  width: 100%;
  border-radius: 12rpx;
  background-color: var(--color-primary);
  min-height: 10rpx;
}

.electricity-page__bar-hour {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--color-label);
  margin-top: 16rpx;
}

/* ── List Tile ────────────────────────────────────────── */
.electricity-page__list-tile {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
}

.electricity-page__list-tile + .electricity-page__list-tile {
  border-top: 1rpx solid var(--color-separator);
}

.electricity-page__list-tile-leading {
  margin-right: 24rpx;
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.electricity-page__list-tile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.electricity-page__list-tile-title {
  font-size: var(--font-body);
  font-weight: 500;
  color: var(--color-label);
}

.electricity-page__list-tile-subtitle {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 4rpx;
}

.electricity-page__list-tile-switch {
  flex-shrink: 0;
}

/* ── Subscription ─────────────────────────────────────── */
.electricity-page__subscription-header {
  display: flex;
  align-items: flex-start;
  padding: 32rpx 32rpx 16rpx;
}

.electricity-page__subscription-header-left {
  flex: 1;
}

.electricity-page__subscription-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--color-label);
}

.electricity-page__subscription-desc {
  font-size: 26rpx;
  color: var(--color-secondary-label);
  margin-top: 8rpx;
  display: block;
}

.electricity-page__subscription-refresh {
  padding: 8rpx;
}

.electricity-page__subscription-loading {
  padding: 56rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Loading ──────────────────────────────────────────── */
.electricity-page__loading {
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.electricity-page__loading-text {
  font-size: var(--font-body);
  color: var(--color-secondary-label);
}

/* ── Dialog / Overlay ─────────────────────────────────── */
.electricity-page__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx;
}

.electricity-page__dialog {
  width: 100%;
  max-width: 600rpx;
  background-color: var(--color-card-bg);
  border-radius: var(--radius-card);
  padding: 48rpx 40rpx 32rpx;
}

.electricity-page__dialog-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--color-label);
  text-align: center;
}

.electricity-page__dialog-desc {
  font-size: 26rpx;
  color: var(--color-secondary-label);
  text-align: center;
  margin-top: 12rpx;
  display: block;
  line-height: 1.5;
}

.electricity-page__dialog-input {
  width: 100%;
  height: 80rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 1rpx solid var(--color-separator);
  border-radius: var(--radius-small);
  background-color: var(--color-grouped-bg);
  color: var(--color-label);
  box-sizing: border-box;
}

.electricity-page__dialog-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.electricity-page__dialog-btn {
  flex: 1;
  padding: 24rpx 0;
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
}

.electricity-page__dialog-btn text {
  font-size: var(--font-body-bold);
}

.electricity-page__dialog-btn--cancel {
  background-color: var(--color-surface-muted);
}
.electricity-page__dialog-btn--cancel text {
  color: var(--color-label);
}

.electricity-page__dialog-btn--confirm {
  background-color: var(--color-primary);
}
.electricity-page__dialog-btn--confirm text {
  color: var(--color-on-accent);
}

/* ── Dialog Detail ────────────────────────────────────── */
.electricity-page__dialog-detail {
  margin-top: 24rpx;
}

.electricity-page__dialog-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.electricity-page__dialog-detail-row + .electricity-page__dialog-detail-row {
  border-top: 1rpx solid var(--color-separator);
}

.electricity-page__dialog-detail-label {
  font-size: 26rpx;
  color: var(--color-secondary-label);
}

.electricity-page__dialog-detail-value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-label);
}
</style>
