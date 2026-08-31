import type { PropsWithChildren, ReactNode } from 'react'
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

export function PageShell({ title, showBack = false, action, className = '', children }: PageShellProps) {
  const theme = useAppStore((state) => state.settings.theme)
  return (
    <View className={`app-page theme-${theme} ${className}`}>
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
