import { useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { ListRow } from '@/components/common/ListRow'
import { AppIcon } from '@/components/common/AppIcon'
import { fetchLinks } from '@/api/education'
import type { LinkItem } from '@/types/domain'
import { openExternalUrl } from '@/utils/platform'
import '@/styles/pages.scss'
import './index.scss'

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true); setError('')
    try { setLinks((await fetchLinks()).sort((left, right) => left.index - right.index)) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '校园导航加载失败') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return keyword ? links.filter((link) => `${link.name} ${link.description || ''}`.toLowerCase().includes(keyword)) : links
  }, [links, query])

  return (
    <PageShell title='校园导航' showBack>
      <View className='page-section'><View className='links-search'><AppIcon name='search' size={19} color='var(--secondary-label)' /><Input value={query} placeholder='搜索校园服务' onInput={(event) => setQuery(event.detail.value)} /></View></View>
      <View className='page-section'><ClubCard padding='none'>
        {loading && links.length === 0 ? <StateView state='loading' title='正在读取校园导航' /> : error ? <StateView state='error' title='校园导航加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : filtered.length === 0 ? <StateView state='empty' title='没有匹配的服务' /> : filtered.map((link) => <ListRow key={link.key || link.url} title={link.name} subtitle={link.description || link.url} icon='link' onClick={() => void openExternalUrl(link.url)} />)}
      </ClubCard></View>
      <View className='page-section'><View className='page-note'><Text>网页打开受微信业务域名限制。若页面无法载入，可在错误页复制链接后使用系统浏览器打开。</Text></View></View>
    </PageShell>
  )
}
