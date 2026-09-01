/* eslint-disable import/first */
const mockNavigateBack = jest.fn()

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    getStorageSync: jest.fn(() => ''),
    setStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    getWindowInfo: jest.fn(() => ({ statusBarHeight: 47, windowWidth: 375 })),
    getMenuButtonBoundingClientRect: jest.fn(() => ({ left: 289, top: 55, height: 32 })),
    navigateBack: mockNavigateBack,
  },
}))
jest.mock('@/components/common/AppIcon', () => ({ AppIcon: () => null }))

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PageShell } from '@/components/common/PageShell'

describe('PageShell', () => {
  test('reserves the system status bar and aligns the custom navbar with the menu button', () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<PageShell title='光序'>页面内容</PageShell>))

    const page = container.querySelector<HTMLElement>('.app-page')
    expect(page?.style.getPropertyValue('--app-status-bar-height')).toBe('47px')
    expect(page?.style.getPropertyValue('--app-navbar-content-height')).toBe('48px')
    expect(page?.style.getPropertyValue('--app-navbar-system-right-inset')).toBe('82px')

    act(() => root.unmount())
  })
})
