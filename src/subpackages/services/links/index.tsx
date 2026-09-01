import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { ListRow } from '@/components/common/ListRow'
import { AppIcon } from '@/components/common/AppIcon'
import type { LinkCategory } from '@/types/domain'
import { openExternalUrl } from '@/utils/platform'
import { useAppStore } from '@/stores/app'
import { getLinksSnapshot } from '@/services/domainRepository'
import '@/styles/pages.scss'
import './index.scss'

export default function LinksPage() {
  const [categories, setCategories] = useState<LinkCategory[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)
  const schoolCode = useAppStore((state) => state.school.code)
  const load = useCallback(async (force = false) => {
    setLoading(true); setError('')
    try {
      const snapshot = await getLinksSnapshot(schoolCode, force ? 'refresh' : 'local-first')
      setCategories(snapshot.data); setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getLinksSnapshot(schoolCode, 'refresh')
        setCategories(refreshed.data); setIsStale(refreshed.isStale)
      }
    }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '校园导航加载失败') }
    finally { setLoading(false) }
  }, [schoolCode])
  useEffect(() => { void load() }, [load])
  usePullDownRefresh(() => { void load(true).finally(() => Taro.stopPullDownRefresh()) })
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return categories.flatMap((category) => category.links
      .filter((link) => !keyword || `${category.name} ${link.name} ${link.description || ''}`.toLowerCase().includes(keyword))
      .map((link) => ({ category, link })))
  }, [categories, query])

  return (
    <PageShell title='校园导航' showBack>
      <View className='page-section'><View className='links-search'><AppIcon name='search' size={19} color='var(--secondary-label)' /><Input value={query} placeholder='搜索校园服务' onInput={(event) => setQuery(event.detail.value)} /></View></View>
      {isStale ? <View className='page-note'>刷新失败，当前显示本地校园导航缓存</View> : null}
      <View className='page-section'><ClubCard padding='none'>
        {loading && categories.length === 0 ? <StateView state='loading' title='正在读取校园导航' /> : error ? <StateView state='error' title='校园导航加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : filtered.length === 0 ? <StateView state='empty' title='没有匹配的服务' /> : filtered.map(({ category, link }) => <ListRow key={`${category.key}:${link.key || link.url}`} title={link.name} subtitle={[category.name, link.description || link.url].filter(Boolean).join(' · ')} icon='link' onClick={() => void openExternalUrl(link.url)} />)}
      </ClubCard></View>
      <View className='page-section'><View className='page-note'><Text>网页打开受微信业务域名限制。若页面无法载入，可在错误页复制链接后使用系统浏览器打开。</Text></View></View>
    </PageShell>
  )
}
