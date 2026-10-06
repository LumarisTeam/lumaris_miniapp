/* eslint-disable import/first */
jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    getStorageSync: jest.fn(() => ''),
    setStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    navigateBack: jest.fn(),
  },
}))
jest.mock('@/components/common/AppIcon', () => ({ AppIcon: () => null }))

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import { DEFAULT_SCHOOL, useAppStore } from '@/stores/app'

describe('FeatureGuard', () => {
  test('does not mount page content when the selected school lacks the feature', () => {
    const originalSchool = useAppStore.getState().school
    useAppStore.setState({ school: { ...DEFAULT_SCHOOL, features: ['login'] } })
    const childMounted = jest.fn()
    function ProtectedContent() {
      childMounted()
      return <div>protected request page</div>
    }
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<FeatureGuard feature='payment' title='校园卡'><ProtectedContent /></FeatureGuard>))
    expect(childMounted).not.toHaveBeenCalled()
    // 文案来自语言包（schoolNotSupported），页面标题仍然用调用方给的名称。
    expect(container.textContent).toContain('当前学校不支持此功能')
    expect(container.textContent).toContain('校园卡')

    act(() => root.unmount())
    useAppStore.setState({ school: originalSchool })
  })
})
