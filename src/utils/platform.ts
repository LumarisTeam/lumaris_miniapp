import Taro from '@tarojs/taro'

export function haptic(style: 'light' | 'medium' = 'light'): void {
  try {
    Taro.vibrateShort({ type: style })
  } catch {
    // Haptics are optional and unsupported in some simulators.
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return
  try {
    await Taro.navigateTo({ url: `/subpackages/content/webview/index?url=${encodeURIComponent(url)}` })
    return
  } catch {
    await copyExternalUrl(url)
  }
}

export async function copyExternalUrl(url: string): Promise<void> {
  try {
    await Taro.setClipboardData({ data: url })
    await Taro.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none' })
  } catch {
    await Taro.showToast({ title: '无法打开此链接', icon: 'none' })
  }
}

export function checkForUpdate(): void {
  if (typeof Taro.getUpdateManager !== 'function') {
    Taro.showToast({ title: '当前环境不支持更新检查', icon: 'none' })
    return
  }
  const manager = Taro.getUpdateManager()
  manager.onCheckForUpdate(({ hasUpdate }) => {
    if (!hasUpdate) Taro.showToast({ title: '当前已是最新版本', icon: 'none' })
  })
  manager.onUpdateReady(() => {
    Taro.showModal({
      title: '更新已就绪',
      content: '新版本已下载，是否立即重启？',
      success: ({ confirm }) => {
        if (confirm) manager.applyUpdate()
      },
    })
  })
  manager.onUpdateFailed(() => Taro.showToast({ title: '更新下载失败', icon: 'none' }))
}
