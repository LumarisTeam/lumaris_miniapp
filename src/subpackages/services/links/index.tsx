import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, Input, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getLinksSnapshot } from '@/services/domainRepository'
import type { LinkCategory, LinkItem } from '@/types/domain'
import { describeError } from '@/utils/errorText'
import { filterLinkCategories, linkIconUrl } from '@/utils/links'
import { openExternalUrl } from '@/utils/platform'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 校园导航（校园工具箱）。
 *
 * 对应 Flutter 的 `lib/ui/pages/link_page/link_page.dart`：每个分类一张卡片，
 * 卡片里是图标网格，点击用外部浏览器打开。分类与链接的顺序由服务端的 index
 * 决定（见 `fetchLinks`）。搜索框是小程序这边的补充。
 */
export function LinksContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const [categories, setCategories] = useState<LinkCategory[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError('')
    try {
      const snapshot = await getLinksSnapshot(schoolCode, force ? 'refresh' : 'local-first')
      setCategories(snapshot.data)
      setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getLinksSnapshot(schoolCode, 'refresh')
        setCategories(refreshed.data)
        setIsStale(refreshed.isStale)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('linkLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [schoolCode, t])

  useEffect(() => { void load() }, [load])
  usePullDownRefresh(() => { void load(true).finally(() => Taro.stopPullDownRefresh()) })

  const visible = useMemo(() => filterLinkCategories(categories, query), [categories, query])

  return (
    <PageShell
      title={t('campusNavigation')}
      showBack
      action={
        <View className='icon-action pressable' onClick={() => void load(true)}>
          <AppIcon name='refresh' size={20} />
        </View>
      }
    >
      {!session ? (
        <StateView
          state='login'
          title={t('guestMode')}
          description={t('guestModeSubtitle')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      ) : (
        <>
          <View className='page-section'>
            <View className='search-field'>
              <AppIcon name='search' size={19} color='var(--secondary-label)' />
              <Input value={query} placeholder={t('searchLocation')} onInput={(event) => setQuery(event.detail.value)} />
            </View>
          </View>

          {isStale ? <View className='page-section'><View className='page-note'>{t('refreshFailedFallback')}</View></View> : null}

          {loading && categories.length === 0 ? (
            <StateView state='loading' title={t('linkLoading')} description={t('linkLoadingSubtitle')} />
          ) : error && categories.length === 0 ? (
            <StateView
              state='error'
              title={t('linkLoadFailed')}
              description={describeError(error, t)}
              actionLabel={t('retry')}
              onAction={() => void load(true)}
            />
          ) : visible.length === 0 ? (
            <StateView state='empty' title={t('linkNoData')} description={t('linkNoDataSubtitle')} />
          ) : (
            visible.map((category) => <LinkCategoryCard key={category.key} category={category} />)
          )}

          <View className='page-section'>
            <View className='page-note'>{t('webviewLimitHint')}</View>
          </View>
        </>
      )}
    </PageShell>
  )
}

function LinkCategoryCard({ category }: { category: LinkCategory }) {
  return (
    <View className='page-section'>
      <ClubCard>
        <View className='link-category__head'>
          <View className='link-category__indicator' />
          <Text className='link-category__name'>{category.name}</Text>
        </View>
        <View className='link-grid'>
          {category.links.map((link) => <LinkCell key={`${link.key}:${link.url}`} link={link} />)}
        </View>
      </ClubCard>
    </View>
  )
}

function LinkCell({ link }: { link: LinkItem }) {
  const iconUrl = linkIconUrl(link)
  return (
    <View className='link-cell pressable' onClick={() => void openExternalUrl(link.url)}>
      <View className='link-cell__icon'>
        {iconUrl
          ? <Image className='link-cell__image' src={iconUrl} mode='aspectFit' />
          : <AppIcon name='link' size={22} color='var(--secondary-label)' />}
      </View>
      <Text className='link-cell__name'>{link.name}</Text>
    </View>
  )
}

export default function LinksPage() {
  return <LinksContent />
}
