import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '@/components/common/AppIcon'
import { useAppStore } from '@/stores/app'
import './common.scss'

interface PageShellProps extends PropsWithChildren {
  title: string
  showBack?: boolean
  action?: ReactNode
  className?: string
}

type NavigationStyle = CSSProperties & {
  '--app-status-bar-height': string
  '--app-navbar-content-height': string
  '--app-navbar-system-right-inset': string
}

function getNavigationStyle(): NavigationStyle | undefined {
  try {
    const systemInfo = typeof Taro.getWindowInfo === 'function'
      ? Taro.getWindowInfo()
      : Taro.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight ?? 0
    if (statusBarHeight <= 0) return undefined

    let contentHeight = 44
    let systemRightInset = 0
    try {
      const menuButton = Taro.getMenuButtonBoundingClientRect()
      const capsuleAlignedHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
      if (capsuleAlignedHeight > 0) contentHeight = capsuleAlignedHeight

      // Keep custom actions to the left of the system capsule, including the navbar's 24rpx side padding.
      const navbarSidePadding = systemInfo.windowWidth * 24 / 750
      systemRightInset = Math.max(0, systemInfo.windowWidth - menuButton.left + 8 - navbarSidePadding)
    } catch {
      // Some Taro targets do not expose the mini-program menu button.
    }

    return {
      '--app-status-bar-height': `${statusBarHeight}px`,
      '--app-navbar-content-height': `${contentHeight}px`,
      '--app-navbar-system-right-inset': `${systemRightInset}px`,
    }
  } catch {
    return undefined
  }
}

export function PageShell({ title, showBack = false, action, className = '', children }: PageShellProps) {
  const theme = useAppStore((state) => state.settings.theme)
  const [navigationStyle] = useState<NavigationStyle | undefined>(() => getNavigationStyle())
  return (
    <View className={`app-page theme-${theme} ${className}`} style={navigationStyle}>
      <View className='app-navbar'>
        <View className='app-navbar__side'>
          {showBack ? (
            <View className='app-navbar__icon pressable' onClick={() => Taro.navigateBack()} aria-label='返回'>
              <AppIcon name='back' size={22} />
            </View>
          ) : null}
        </View>
        <Text className='app-navbar__title'>{title}</Text>
        <View className='app-navbar__side app-navbar__side--right'>{action}</View>
      </View>
      <View className='app-page__content'>{children}</View>
    </View>
  )
}
