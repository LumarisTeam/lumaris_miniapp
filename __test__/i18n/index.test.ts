/* eslint-disable import/first */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mockLocale = { value: 'system' as string }

jest.mock('@/stores/app', () => ({
  useAppStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ settings: { locale: mockLocale.value } }),
    { getState: () => ({ settings: { locale: mockLocale.value } }) },
  ),
}))

import {
  FALLBACK_LOCALE,
  LOCALE_OPTIONS,
  getCurrentLocale,
  normalizeLocaleTag,
  resolveLocale,
  t,
  translate,
} from '@/i18n'
import de from '@/i18n/locales/de'
import en from '@/i18n/locales/en'
import fr from '@/i18n/locales/fr'
import ja from '@/i18n/locales/ja'
import ko from '@/i18n/locales/ko'
import ru from '@/i18n/locales/ru'
import zhCN from '@/i18n/locales/zh-CN'
import zhHant from '@/i18n/locales/zh-Hant'

const BUNDLES = { 'zh-CN': zhCN, 'zh-Hant': zhHant, en, ja, ko, fr, de, ru }

describe('locale resolution', () => {
  test('normalizes system language tags', () => {
    expect(normalizeLocaleTag('zh_CN')).toBe('zh-CN')
    expect(normalizeLocaleTag('zh-Hans-CN')).toBe('zh-CN')
    expect(normalizeLocaleTag('zh_TW')).toBe('zh-Hant')
    expect(normalizeLocaleTag('zh-Hant-HK')).toBe('zh-Hant')
    expect(normalizeLocaleTag('en-US')).toBe('en')
    expect(normalizeLocaleTag('JA')).toBe('ja')
    expect(normalizeLocaleTag('ko-KR')).toBe('ko')
    expect(normalizeLocaleTag('de')).toBe('de')
  })

  test('returns null for unsupported or missing tags', () => {
    expect(normalizeLocaleTag('pt-BR')).toBeNull()
    expect(normalizeLocaleTag('')).toBeNull()
    expect(normalizeLocaleTag(undefined)).toBeNull()
  })

  test('follows the system only when set to system', () => {
    expect(resolveLocale('en', 'zh_CN')).toBe('en')
    expect(resolveLocale('system', 'zh_TW')).toBe('zh-Hant')
    expect(resolveLocale('system', 'pt-BR')).toBe(FALLBACK_LOCALE)
    expect(resolveLocale('system')).toBe(FALLBACK_LOCALE)
  })

  test('reads the locale currently held by settings', () => {
    mockLocale.value = 'ja'
    expect(getCurrentLocale()).toBe('ja')
    expect(t('home')).toBe(ja.home)

    mockLocale.value = 'system'
    expect(getCurrentLocale('de-DE')).toBe('de')
  })

  test('exposes every generated language in Flutter option order', () => {
    expect(LOCALE_OPTIONS.map((option) => option.code)).toEqual([
      'system', 'zh-CN', 'en', 'ja', 'ru', 'fr', 'de', 'ko', 'zh-Hant',
    ])
    for (const option of LOCALE_OPTIONS) {
      expect(typeof translate('zh-CN', option.labelKey)).toBe('string')
    }
  })
})

describe('translation', () => {
  test('interpolates ARB placeholders', () => {
    expect(translate('zh-CN', 'periodRange', { start: 1, end: 2 })).toBe('第1-2节')
    expect(translate('zh-CN', 'weekUnit', { n: 5 })).toBe('5周')
    expect(translate('en', 'periodRange', { start: 3, end: 4 })).toContain('3')
  })

  test('leaves unknown placeholders untouched', () => {
    expect(translate('zh-CN', 'weekUnit', {})).toBe('{n}周')
  })

  test('falls back to the source language for an unknown locale', () => {
    expect(translate('pt' as never, 'home')).toBe(zhCN.home)
  })

  test('every generated bundle carries the same key set with no empty values', () => {
    const reference = Object.keys(zhCN).sort()
    expect(reference.length).toBeGreaterThan(600)

    for (const [locale, bundle] of Object.entries(BUNDLES)) {
      expect({ locale, keys: Object.keys(bundle).sort() }).toEqual({ locale, keys: reference })
      const empty = Object.entries(bundle).filter(([, value]) => value.trim() === '')
      expect({ locale, empty }).toEqual({ locale, empty: [] })
    }
  })

  test('folds the mini-program-only overlay into every bundle', () => {
    // 这些 key 不在 Flutter 的 ARB 里，是 generateI18n.mjs 从 scripts/i18n-extra.json
    // 合并进来的；漏跑生成或漏了某种语言时，页面会静默显示 key 本身。
    const overlay = JSON.parse(
      readFileSync(resolve(__dirname, '../../scripts/i18n-extra.json'), 'utf8'),
    ) as Record<string, Record<string, string>>

    for (const [key, values] of Object.entries(overlay)) {
      if (key.startsWith('$')) continue
      for (const [locale, bundle] of Object.entries(BUNDLES)) {
        expect({ key, locale, value: bundle[key as keyof typeof bundle] })
          .toEqual({ key, locale, value: values[locale] })
      }
    }
  })

  test('translates the app name in every language', () => {
    for (const bundle of Object.values(BUNDLES)) {
      expect(typeof bundle.appName).toBe('string')
      expect(bundle.appName.length).toBeGreaterThan(0)
    }
  })
})
