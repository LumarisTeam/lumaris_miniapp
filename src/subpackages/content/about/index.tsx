import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

const DOCUMENTS = [
  { title: '帮助与常见问题', icon: 'tips' as const, kind: 'help' },
  { title: '软件许可协议', icon: 'book' as const, kind: 'agreement' },
  { title: '隐私政策', icon: 'notice' as const, kind: 'privacy' },
  { title: '用户协议', icon: 'book' as const, kind: 'user-agreement' },
  { title: '作者与开源项目', icon: 'people' as const, kind: 'author' },
  { title: '开源许可证', icon: 'list' as const, kind: 'license' },
  { title: '一个小彩蛋', icon: 'success' as const, kind: 'egg' },
]

export default function AboutPage() {
  return (
    <PageShell title='关于光序' showBack>
      <View className='about-brand'><Image className='about-brand__logo' src={logo} mode='aspectFit' /><Text className='about-brand__name'>光序</Text><Text className='about-brand__version'>小程序版 1.0.0</Text><Text className='about-brand__description'>西建大 iOS Club 出品的校园信息与生活服务工具</Text></View>
      <View className='page-section'><ClubCard padding='none'>{DOCUMENTS.map((item) => <ListRow key={item.kind} title={item.title} icon={item.icon} onClick={() => Taro.navigateTo({ url: `/subpackages/content/document/index?kind=${item.kind}` })} />)}</ClubCard></View>
      <View className='about-footer'><Text>Made by iOS Club · 仅供学习与校园服务使用</Text></View>
    </PageShell>
  )
}
