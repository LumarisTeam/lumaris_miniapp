import { useEffect, useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StateView } from '@/components/common/StateView'
import { getStudyProgressSnapshot } from '@/services/domainRepository'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
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
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const school = useAppStore((state) => state.school)
  const [progress, setProgress] = useState<StudyModule[]>([])
  const username = session?.username
  const canShowProgress = school.features.includes('study_progress')

  useEffect(() => {
    if (username && canShowProgress) {
      void getStudyProgressSnapshot(username, school.code, 'local-first').then(async (snapshot) => {
        setProgress(snapshot.data)
        if (snapshot.isFromLocal) setProgress((await getStudyProgressSnapshot(username, school.code, 'refresh')).data)
      }).catch(() => setProgress([]))
    }
  }, [username, canShowProgress, school.code])

  const entries = ENTRIES.filter((entry) => !entry.feature || school.features.includes(entry.feature))
  const completed = progress.reduce((sum, item) => sum + Number(item.total.actual || 0), 0)
  const required = progress.reduce((sum, item) => sum + Number(item.total.full || 0), 0)

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

      {session && required > 0 ? (
        <View className='page-section'>
          <ClubCard>
            <View className='row row--between'><Text className='profile-progress__title'>学习进度</Text><Text className='profile-progress__value'>{completed.toFixed(1)} / {required.toFixed(1)} 学分</Text></View>
            <View className='profile-progress__track'><View className='profile-progress__fill' style={{ width: `${Math.min(100, completed / required * 100)}%` }} /></View>
          </ClubCard>
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
