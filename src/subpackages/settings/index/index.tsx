import { Picker, Switch, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { useAppStore } from '@/stores/app'
import { useCourseStore } from '@/stores/course'
import { useScoreStore } from '@/stores/score'
import type { StartPage, ThemeMode } from '@/types/domain'
import { checkForUpdate, haptic } from '@/utils/platform'
import { clearEducationCache } from '@/utils/storage'
import '@/styles/pages.scss'

const THEMES: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]
const START_PAGES: Array<{ value: StartPage; label: string }> = [
  { value: 'home', label: '首页' },
  { value: 'schedule', label: '课表' },
  { value: 'score', label: '成绩' },
  { value: 'profile', label: '我的' },
]
const HOME_SERVICES = [
  { value: 'electricity' as const, label: '电费' },
  { value: 'bus' as const, label: '校车' },
  { value: 'payment' as const, label: '校园卡' },
]

export default function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const toggleService = useAppStore((state) => state.toggleService)
  const clearCourses = useCourseStore((state) => state.clearRemote)
  const clearScores = useScoreStore((state) => state.clear)
  const startIndex = Math.max(0, START_PAGES.findIndex((item) => item.value === settings.startPage))
  const clearCache = () => {
    Taro.showModal({
      title: '确认清除缓存',
      content: '将清除课程、成绩和校园服务缓存，不会删除自定义课程。',
      confirmText: '清除缓存',
      confirmColor: '#ff3b30',
      success: ({ confirm }) => {
        if (!confirm) return
        clearEducationCache(); clearCourses(); clearScores()
        Taro.showToast({ title: '缓存已清除', icon: 'success' })
      },
    })
  }

  return (
    <PageShell title='设置与关于' showBack>
      <View className='page-section'>
        <Text className='form-label'>外观</Text>
        <ClubCard>
          <View className='segmented'>
            {THEMES.map((theme) => (
              <View className={`segmented__item pressable ${settings.theme === theme.value ? 'segmented__item--active' : ''}`} key={theme.value} onClick={() => setSettings({ theme: theme.value })}>{theme.label}</View>
            ))}
          </View>
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>通用</Text>
        <ClubCard padding='none'>
          <Picker mode='selector' value={startIndex} range={START_PAGES.map((item) => item.label)} onChange={(event) => setSettings({ startPage: START_PAGES[Number(event.detail.value)]?.value || 'home' })}>
            <ListRow title='启动时显示' icon='home' value={START_PAGES[startIndex].label} />
          </Picker>
          <ListRow title='触感反馈' subtitle='在支持的真机上提供轻触反馈' icon='alarm' trailing={<Switch checked={settings.hapticFeedback} color='#007aff' onChange={(event) => { setSettings({ hapticFeedback: event.detail.value }); if (event.detail.value) haptic() }} />} />
          <ListRow title='课表设置' subtitle='显示方式、忽略课程与自定义课程' icon='calendar' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/schedule/index' })} />
          <ListRow title='清除缓存' subtitle='保留自定义课程' icon='delete' danger onClick={clearCache} />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>首页服务</Text>
        <ClubCard padding='none'>
          {HOME_SERVICES.map((service) => (
            <ListRow key={service.value} title={service.label} subtitle='在首页快捷入口中显示' icon='service' trailing={<Switch checked={settings.visibleServices.includes(service.value)} color='#007aff' onChange={() => toggleService(service.value)} />} />
          ))}
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>关于</Text>
        <ClubCard padding='none'>
          <ListRow title='检查更新' subtitle='使用微信小程序更新管理器' icon='refresh' onClick={checkForUpdate} />
          <ListRow title='关于光序' icon='tips' onClick={() => Taro.navigateTo({ url: '/subpackages/content/about/index' })} />
          <ListRow title='隐私政策' icon='notice' onClick={() => Taro.navigateTo({ url: '/subpackages/content/document/index?kind=privacy' })} />
          <ListRow title='用户协议' icon='book' onClick={() => Taro.navigateTo({ url: '/subpackages/content/document/index?kind=user-agreement' })} />
        </ClubCard>
      </View>
    </PageShell>
  )
}
