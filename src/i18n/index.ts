import { useMemo } from 'react'
import { useAppStore } from '@/stores/app'
import type { LocaleCode } from '@/types/domain'
import de from '@/i18n/locales/de'
import en from '@/i18n/locales/en'
import fr from '@/i18n/locales/fr'
import ja from '@/i18n/locales/ja'
import ko from '@/i18n/locales/ko'
import ru from '@/i18n/locales/ru'
import zhCN from '@/i18n/locales/zh-CN'
import zhHant from '@/i18n/locales/zh-Hant'

export type { LocaleCode }

/**
 * 多语言入口。
 *
 * 语言包由 `scripts/generateI18n.mjs` 从 Flutter 的 ARB 生成，共享文案的唯一事实
 * 来源是 Flutter 仓库，这里不手工维护第二份。键名与 Flutter 的
 * `AppLocalizations` 完全一致，方便两端对照。
 *
 * 小程序独有的说法（微信业务域名、webview 回退一类 Flutter 侧没有的概念）来自
 * `scripts/i18n-extra.json`，生成时合并进同一份语言包，所以 t() 的用法完全一样。
 */

/** 具体语言（不含 system）。 */
export type ResolvedLocale = Exclude<LocaleCode, 'system'>

/** 可直接作为 t() 参数的键名，从源语言推导。 */
export type MessageKey = keyof typeof zhCN

/** 找不到译文时回退到源语言。 */
export const FALLBACK_LOCALE: ResolvedLocale = 'zh-CN'

type Bundle = Record<MessageKey, string>

const BUNDLES: Record<ResolvedLocale, Bundle> = {
  'zh-CN': zhCN,
  'zh-Hant': zhHant,
  en,
  ja,
  ko,
  fr,
  de,
  ru,
}

/**
 * 设置页展示用的语言列表。
 *
 * 顺序与 Flutter 的 `AppLocaleService.options` 一致；名称取自语言包本身，
 * 所以在任何一种语言下都会显示成该语言的本地写法。
 */
export const LOCALE_OPTIONS: Array<{ code: LocaleCode; labelKey: MessageKey }> = [
  { code: 'system', labelKey: 'systemLanguage' },
  { code: 'zh-CN', labelKey: 'simplifiedChinese' },
  { code: 'en', labelKey: 'english' },
  { code: 'ja', labelKey: 'japanese' },
  { code: 'ru', labelKey: 'russian' },
  { code: 'fr', labelKey: 'french' },
  { code: 'de', labelKey: 'german' },
  { code: 'ko', labelKey: 'korean' },
  { code: 'zh-Hant', labelKey: 'traditionalChinese' },
]

/**
 * 把系统语言标签（`zh_CN`、`zh-Hant-TW`、`en-US`…）归一到受支持的语言。
 * 匹配不到时返回 null，由调用方决定回退。
 */
export function normalizeLocaleTag(tag: string | undefined | null): ResolvedLocale | null {
  if (!tag) return null

  const normalized = tag.replace(/_/g, '-').toLowerCase()
  const [language, ...rest] = normalized.split('-')

  if (language === 'zh') {
    const isTraditional =
      rest.includes('hant') || rest.includes('tw') || rest.includes('hk') || rest.includes('mo')
    return isTraditional ? 'zh-Hant' : 'zh-CN'
  }

  const supported: ResolvedLocale[] = ['en', 'ja', 'ko', 'fr', 'de', 'ru']
  const match = supported.find((code) => code === language)
  return match ?? null
}

/** 把设置里的语言（可能是 system）解析成具体语言。 */
export function resolveLocale(
  locale: LocaleCode,
  systemLocale?: string | null,
): ResolvedLocale {
  if (locale !== 'system') return locale
  return normalizeLocaleTag(systemLocale) ?? FALLBACK_LOCALE
}

/**
 * 取值并做占位符插值。
 *
 * ARB 里的占位符统一是 `{name}` 形式（无 ICU 复数/选择分支），缺失的参数
 * 保留原样，便于在开发期一眼看出漏传。
 */
export function translate(
  locale: ResolvedLocale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = BUNDLES[locale]?.[key] ?? BUNDLES[FALLBACK_LOCALE][key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )
}

/** 当前生效的具体语言（非 React 代码用）。 */
export function getCurrentLocale(systemLocale?: string | null): ResolvedLocale {
  return resolveLocale(useAppStore.getState().settings.locale, systemLocale)
}

/** 非 React 代码用的翻译函数，语言切换后需自行重新取值。 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return translate(getCurrentLocale(), key, params)
}

export type Translator = (key: MessageKey, params?: Record<string, string | number>) => string

/**
 * 组件用的翻译函数：订阅设置里的语言，切换语言时触发重渲染。
 */
export function useTranslation(): Translator {
  const locale = useAppStore((state) => state.settings.locale)
  return useMemo(() => {
    const resolved = resolveLocale(locale)
    return (key: MessageKey, params?: Record<string, string | number>) =>
      translate(resolved, key, params)
  }, [locale])
}
