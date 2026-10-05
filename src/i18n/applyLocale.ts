import Taro from '@tarojs/taro'
import { getCurrentLocale, translate, type MessageKey } from '@/i18n'

/**
 * 把当前语言应用到小程序的原生外壳。
 *
 * 页面标题由 `PageShell` 自己渲染（`navigationStyle: custom`），但 tabBar 文案
 * 来自 `app.config.ts` 的静态配置，只能在运行时用 `setTabBarItem` 覆盖。
 */

const TAB_LABELS: MessageKey[] = ['home', 'schedule', 'score', 'profile']

/** 读取系统语言，失败时返回 null（由 i18n 回退到源语言）。 */
function readSystemLanguage(): string | null {
  try {
    return Taro.getSystemInfoSync().language ?? null
  } catch {
    return null
  }
}

/**
 * 按当前设置刷新 tabBar 文案。
 *
 * 在 app 启动时调用一次，并在语言设置变化后再次调用。失败（例如在非 tabBar
 * 页面或测试环境）只忽略，不影响功能。
 */
export function applyLocaleToShell(): void {
  const locale = getCurrentLocale(readSystemLanguage())
  const labels = TAB_LABELS.map((key) => translate(locale, key))

  labels.forEach((text, index) => {
    try {
      void Taro.setTabBarItem({ index, text })
    } catch {
      // tabBar 尚未就绪或当前平台不支持，保持静态文案即可。
    }
  })
}
