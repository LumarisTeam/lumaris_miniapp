import { useEffect, useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StudyCreditCard } from '@/components/profile/StudyCreditCard'
import { StateView } from '@/components/common/StateView'
import { getStudyProgressSnapshot } from '@/services/domainRepository'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTranslation } from '@/i18n'
import type { Feature, StudyModule } from '@/types/domain'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

interface ProfileEntry {
  title: string
  subtitle?: string
  icon: 'link' | 'service' | 'notice' | 'book' | 'card' | 'location' | 'tips' | 'settings'
  route: string
  feature?: Feature
}

const ENTRIES: ProfileEntry[] = [
  { title: '校园导航', icon: 'link', route: '/subpackages/services/links/index' },
  { title: '校车时刻', icon: 'service', route: '/subpackages/services/bus/index', feature: 'bus_schedule' },
  { title: '电费查询', icon: 'notice', route: '/subpackages/services/electricity/index', feature: 'electricity' },
  { title: '培养计划', icon: 'book', route: '/subpackages/services/program/index', feature: 'program' },
  { title: '校园卡', icon: 'card', route: '/subpackages/services/payment/index', feature: 'payment' },
  { title: '校园地图', icon: 'location', route: '/subpackages/services/map/index', feature: 'map' },
  { title: '帮助', icon: 'tips', route: '/subpackages/content/document/index?kind=help' },
  { title: '设置与关于', icon: 'settings', route: '/subpackages/settings/index/index' },
]

export default function ProfilePage() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const school = useAppStore((state) => state.school)
  const [progress, setProgress] = useState<StudyModule[]>([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState('')
  const username = session?.username
  const canShowProgress = school.features.includes('study_progress')

  useEffect(() => {
    if (!username || !canShowProgress) {
      setProgress([])
      return
    }

    let cancelled = false
    const load = async () => {
      setProgressLoading(true)
      setProgressError('')
      try {
        // 先渲染本地缓存，再后台拉一次，和 Flutter ProfilePage 的行为一致。
        const snapshot = await getStudyProgressSnapshot(username, school.code, 'local-first')
        if (cancelled) return
        setProgress(snapshot.data)
        setProgressLoading(false)

        if (snapshot.isFromLocal) {
          const refreshed = await getStudyProgressSnapshot(username, school.code, 'refresh')
          if (!cancelled) setProgress(refreshed.data)
        }
      } catch (error) {
        if (cancelled) return
        setProgressError(error instanceof Error ? error.message : String(error))
      } finally {
        if (!cancelled) setProgressLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [username, canShowProgress, school.code])

  const entries = ENTRIES.filter((entry) => !entry.feature || school.features.includes(entry.feature))

  return (
    <PageShell title='我的'>
      <View className='profile-header'>
        <Image className='profile-header__avatar' src={logo} mode='aspectFit' />
        <View className='grow'>
          <Text className='profile-header__name'>{session?.username || '未登录'}</Text>
          <Text className='profile-header__meta'>{session ? `${school.name} 教务账号` : '游客'}</Text>
        </View>
        {!session ? <View className='profile-header__login pressable' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>登录</View> : null}
      </View>

      {session && canShowProgress ? (
        <View className='page-section'>
          {progressLoading && progress.length === 0 ? (
            <StateView state='loading' compact title={t('syncingAcademic')} description={t('syncingAcademicSubtitle')} />
          ) : progressError && progress.length === 0 ? (
            <StateView state='error' compact title={t('loadFailed')} description={progressError} />
          ) : (
            progress.map((module) => <StudyCreditCard key={module.type} data={module} />)
          )}
        </View>
      ) : null}

      <View className='page-section'>
        <ClubCard padding='none'>
          {entries.map((entry) => <ListRow key={entry.route} title={entry.title} subtitle={entry.subtitle} icon={entry.icon} onClick={() => Taro.navigateTo({ url: entry.route })} />)}
        </ClubCard>
      </View>

      {session ? (
        <View className='page-section'><ClubCard padding='none'><ListRow title='退出登录' subtitle='本机不会保存教务密码' icon='user' danger onClick={() => Taro.showModal({ title: '退出登录', content: '将清除本机登录会话，是否继续？', success: ({ confirm }) => { if (confirm) logout() } })} /></ClubCard></View>
      ) : (
        <StateView state='login' compact title='当前为游客模式' description='自定义课程仍会保存在本机' actionLabel='登录教务系统' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} />
      )}
    </PageShell>
  )
}
