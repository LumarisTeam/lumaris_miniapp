import type { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAppStore } from '@/stores/app'
import { applyLocaleToShell } from '@/i18n/applyLocale'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    applyLocaleToShell()
    // 功能开关决定整个页面是否可用，启动时后台刷一次，失败就用缓存。
    void useAppStore.getState().refreshSchoolDetail(useAppStore.getState().school.code)
    const startPage = useAppStore.getState().settings.startPage
    if (startPage !== 'home') {
      setTimeout(() => {
        void Taro.switchTab({ url: `/pages/${startPage}/index` })
      }, 0)
    }
  })

  return children
}

export default App
