<template>
  <view class="network-page">
    <AppNavbar title="校园网" show-back />

    <EmptyState
      icon="wifi"
      title="校园网"
      description="网络使用数据需要在登录后查看"
      padding-top="200rpx"
    />
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
</script>

<style scoped>
.network-page {
  min-height: 100vh;
  background-color: var(--color-grouped-bg);
}
</style>
