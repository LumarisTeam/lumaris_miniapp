<template>
  <view class="link-page">
    <AppNavbar title="快速链接" show-back />

    <scroll-view scroll-y class="link-page__scroll" v-if="!loading" :refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="onPullRefresh">
      <template v-if="links.length > 0">
        <view class="link-page__section" v-for="(group, category) in groupedLinks" :key="category">
          <view class="link-page__category-title">
            <LucideIcon name="link" :size="16" color="var(--color-secondary-label)" />
            <text>{{ category }}</text>
          </view>
          <ClubCard padding="0">
            <view
              v-for="(item, idx) in group"
              :key="idx"
              class="link-page__item"
              :class="{ 'link-page__item--last': idx === group.length - 1 }"
              @click="openLink(item.url)"
            >
              <view class="link-page__item-body">
                <LucideIcon name="link" :size="18" color="var(--color-primary)" />
                <view class="link-page__item-text">
                  <text class="link-page__item-name">{{ item.name }}</text>
                  <text v-if="item.description" class="link-page__item-desc">{{ item.description }}</text>
                </view>
              </view>
              <LucideIcon name="external-link" :size="16" color="var(--color-tertiary-label)" />
            </view>
          </ClubCard>
        </view>
      </template>

      <EmptyState v-else icon="link" title="暂无链接" :padding-top="'120rpx'" />
    </scroll-view>

    <LoadingState v-else text="加载中..." padding-top="120rpx" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import ClubCard from '@/components/common/ClubCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { getSchoolNav } from '@/api/modules/link'
import type { LinkItem } from '@/types'

const links = ref<LinkItem[]>([])
const loading = ref(false)
const isRefreshing = ref(false)

const groupedLinks = computed(() => {
  const groups: Record<string, LinkItem[]> = {}
  links.value
    .sort((a, b) => a.index - b.index)
    .forEach((link) => {
      const category = link.index > 0 ? '常用链接' : '其他'
      if (!groups[category]) groups[category] = []
      groups[category].push(link)
    })
  return groups
})

function openLink(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({ title: '链接已复制到剪贴板', icon: 'success' })
    },
  })
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getSchoolNav()
    if (res.data) {
      links.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch links:', e)
  } finally {
    loading.value = false
  }
}

async function onPullRefresh() {
  isRefreshing.value = true
  await fetchData()
  isRefreshing.value = false
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.link-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}

.link-page__scroll {
  height: calc(100vh - 88px - env(safe-area-inset-top));
}

.link-page__section {
  padding: 32rpx;
}

.link-page__category-title {
  font-size: var(--font-caption-bold);
  color: var(--color-secondary-label);
  padding: 0 8rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.link-page__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.link-page__item-text {
  flex: 1;
  min-width: 0;
}

.link-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-separator);
  transition: opacity var(--transition-fast);
}

.link-page__item:active {
  opacity: 0.6;
}

.link-page__item--last {
  border-bottom: none;
}

.link-page__item-body {
  flex: 1;
  min-width: 0;
}

.link-page__item-name {
  font-size: var(--font-body);
  color: var(--color-label);
  display: block;
}

.link-page__item-desc {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  margin-top: 4rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
