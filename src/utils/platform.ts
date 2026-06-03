let systemInfo: UniApp.GetSystemInfoResult | null = null

export function getSystemInfo(): UniApp.GetSystemInfoResult {
  if (!systemInfo) {
    systemInfo = uni.getSystemInfoSync()
  }
  return systemInfo
}

export function isDarkMode(): boolean {
  const info = getSystemInfo()
  return info.theme === 'dark'
}

export function getStatusBarHeight(): number {
  return getSystemInfo().statusBarHeight ?? 20
}

export function getWindowWidth(): number {
  return getSystemInfo().windowWidth
}

export function getPlatform(): string {
  return getSystemInfo().platform
}

export function rpxToPx(rpx: number): number {
  const info = getSystemInfo()
  return (rpx * info.windowWidth) / 750
}

export function getMenuButtonInfo(): UniApp.GetMenuButtonBoundingClientRectRes | null {
  // #ifdef MP-WEIXIN
  try {
    return uni.getMenuButtonBoundingClientRect()
  } catch {
    return null
  }
  // #endif
  return null
}
