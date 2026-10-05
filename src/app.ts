import type { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAppStore } from '@/stores/app'
import { applyLocaleToShell } from '@/i18n/applyLocale'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    applyLocaleToShell()
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
