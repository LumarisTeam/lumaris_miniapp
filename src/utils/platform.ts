import Taro from '@tarojs/taro'
import { t } from '@/i18n'
import { useAppStore } from '@/stores/app'

/** 备案号，展示在设置页的「关于」里。 */
export const ICP_NUMBER = '陕ICP备2024031872号-2A'

/** 轻触反馈。设置里关掉后所有调用点一起静音，调用方不用各自判断。 */
export function haptic(style: 'light' | 'medium' = 'light'): void {
  if (!useAppStore.getState().settings.hapticFeedback) return
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
    await Taro.showToast({ title: t('webviewCopySuccess'), icon: 'none' })
  } catch {
    await Taro.showToast({ title: t('webviewCopyFailed'), icon: 'none' })
  }
}

export function checkForUpdate(): void {
  if (typeof Taro.getUpdateManager !== 'function') {
    Taro.showToast({ title: t('updateUnsupported'), icon: 'none' })
    return
  }
  const manager = Taro.getUpdateManager()
  manager.onCheckForUpdate(({ hasUpdate }) => {
    if (!hasUpdate) Taro.showToast({ title: t('updateLatest'), icon: 'none' })
  })
  manager.onUpdateReady(() => {
    Taro.showModal({
      title: t('updateReadyTitle'),
      content: t('updateReadyContent'),
      success: ({ confirm }) => {
        if (confirm) manager.applyUpdate()
      },
    })
  })
  manager.onUpdateFailed(() => Taro.showToast({ title: t('updateDownloadFailed'), icon: 'none' }))
}
