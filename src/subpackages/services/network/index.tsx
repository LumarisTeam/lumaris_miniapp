import { View } from '@tarojs/components'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { openExternalUrl } from '@/utils/platform'
import '@/styles/pages.scss'

const NETWORK_LINKS = [
  { title: '校园网认证', subtitle: '打开统一认证页面', url: 'http://10.255.255.46' },
  { title: '网络服务中心', subtitle: '查看网络通知与帮助', url: 'https://nic.xauat.edu.cn' },
]

export default function NetworkPage() {
  return (
    <PageShell title='校园网' showBack>
      <View className='page-section'><ClubCard padding='none'>{NETWORK_LINKS.map((item) => <ListRow key={item.url} title={item.title} subtitle={item.subtitle} icon='service' onClick={() => void openExternalUrl(item.url)} />)}</ClubCard></View>
      <View className='page-section'><View className='page-note'>校园网认证地址通常只能在连接校园网络后访问。微信可能阻止 HTTP 页面，届时请复制链接到系统浏览器。</View></View>
    </PageShell>
  )
}
