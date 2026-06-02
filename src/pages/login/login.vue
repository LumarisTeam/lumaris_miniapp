<template>
  <view class="login-page">
    <AppNavbar title="登录" show-back background-color="transparent" />

    <view class="login-page__body">
      <view class="login-page__logo">
        <LucideIcon name="graduation-cap" :size="48" color="var(--color-on-accent)" />
      </view>

      <view class="login-page__header">
        <text class="login-page__title">欢迎回来</text>
        <text class="login-page__subtitle">登录以使用完整功能</text>
      </view>

      <view class="login-page__form">
        <view class="login-page__input-group">
          <view class="login-page__input">
            <text class="login-page__input-label">学号</text>
            <wd-input
              v-model="username"
              placeholder="请输入学号"
              border
              clearable
            />
          </view>
          <view class="login-page__divider" />
          <view class="login-page__input">
            <text class="login-page__input-label">密码</text>
            <wd-input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              border
              clearable
            />
          </view>
        </view>

        <view class="login-page__submit">
          <wd-button
            type="primary"
            size="large"
            :loading="userStore.loading"
            block
            custom-style="height: 104rpx; font-size: 34rpx; font-weight: 600; border-radius: 24rpx;"
            @click="handleLogin"
          >
            登录
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import LucideIcon from '@/components/icons/LucideIcon.vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'

const userStore = useUserStore()
const courseStore = useCourseStore()

const username = ref('')
const password = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入学号和密码', icon: 'none' })
    return
  }

  uni.showLoading({ title: '登录中...', mask: true })
  try {
    const success = await userStore.loginAction(username.value, password.value)
    uni.hideLoading()
    if (success) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      courseStore.fetchCourses(userStore.studentId)
      setTimeout(() => {
        uni.navigateBack()
      }, 800)
    } else {
      uni.showToast({ title: '登录失败，请检查账号密码', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: var(--color-app-bg);
}

.login-page__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 48rpx 0;
  max-width: 600rpx;
  margin: 0 auto;
}

.login-page__logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: var(--radius-tile);
  background: linear-gradient(135deg, var(--color-primary), var(--color-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.login-page__header {
  text-align: center;
  margin-bottom: 64rpx;
}

.login-page__title {
  font-size: 56rpx;
  font-weight: bold;
  color: var(--color-label);
  display: block;
}

.login-page__subtitle {
  font-size: var(--font-body);
  color: var(--color-secondary-label);
  margin-top: 12rpx;
  display: block;
}

.login-page__form {
  width: 100%;
}

.login-page__input-group {
  background-color: var(--color-card-bg);
  border-radius: var(--radius-panel);
  overflow: hidden;
  border: 1rpx solid var(--color-separator);
  margin-bottom: 48rpx;
}

.login-page__input {
  padding: 24rpx 32rpx;
}

.login-page__input-label {
  font-size: var(--font-caption);
  color: var(--color-secondary-label);
  display: block;
  margin-bottom: 12rpx;
}

.login-page__divider {
  height: 1rpx;
  background-color: var(--color-separator);
  margin: 0 32rpx;
}

.login-page__submit {
  width: 100%;
}
</style>
