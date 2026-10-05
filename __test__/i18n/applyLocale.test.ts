/* eslint-disable import/first */
const mockSetTabBarItem = jest.fn()
const mockGetSystemInfoSync = jest.fn(() => ({ language: 'zh_CN' }))
const mockLocale = { value: 'system' as string }

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    setTabBarItem: (...args: unknown[]) => mockSetTabBarItem(...args),
    getSystemInfoSync: () => mockGetSystemInfoSync(),
  },
}))

jest.mock('@/stores/app', () => ({
  useAppStore: {
    getState: () => ({ settings: { locale: mockLocale.value } }),
  },
}))

import { applyLocaleToShell } from '@/i18n/applyLocale'

describe('applyLocaleToShell', () => {
  beforeEach(() => {
    mockSetTabBarItem.mockReset()
    mockLocale.value = 'system'
    mockGetSystemInfoSync.mockReturnValue({ language: 'zh_CN' })
  })

  test('localizes every tab from the system language', () => {
    applyLocaleToShell()

    expect(mockSetTabBarItem.mock.calls.map(([arg]) => arg)).toEqual([
      { index: 0, text: '首页' },
      { index: 1, text: '课表' },
      { index: 2, text: '成绩' },
      { index: 3, text: '我的' },
    ])
  })

  test('follows an explicit language over the system one', () => {
    mockLocale.value = 'en'
    mockGetSystemInfoSync.mockReturnValue({ language: 'ja_JP' })

    applyLocaleToShell()

    expect(mockSetTabBarItem.mock.calls[0][0]).toEqual({ index: 0, text: 'Home' })
    expect(mockSetTabBarItem.mock.calls[3][0]).toEqual({ index: 3, text: 'Me' })
  })

  test('falls back to the source language when the system one is unsupported', () => {
    mockGetSystemInfoSync.mockReturnValue({ language: 'pt_BR' })

    applyLocaleToShell()

    expect(mockSetTabBarItem.mock.calls[0][0]).toEqual({ index: 0, text: '首页' })
  })

  test('ignores a failing tab bar update', () => {
    mockSetTabBarItem.mockImplementation(() => {
      throw new Error('tabBar not ready')
    })

    expect(() => applyLocaleToShell()).not.toThrow()
  })
})
