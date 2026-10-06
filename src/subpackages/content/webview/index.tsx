import { useState } from 'react'
import { Button, Text, View, WebView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { useTranslation } from '@/i18n'
import { copyExternalUrl } from '@/utils/platform'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 外部网页容器。
 *
 * 微信只允许打开业务域名下的网页，其余会直接失败，所以这里要有一个能复制链接
 * 的回退页——对应 Flutter 侧 `url_launcher` 打不开时的处理。
 */
export default function WebViewPage() {
  const t = useTranslation()
  const router = useRouter()
  const url = decodeURIComponent(router.params.url || '')
  const [failed, setFailed] = useState(!/^https?:\/\//.test(url))

  if (failed) {
    return (
      <PageShell title={t('webviewTitle')} showBack>
        <View className='webview-fallback'>
          <Text className='webview-fallback__title'>{t('webviewDomainBlocked')}</Text>
          <Text className='webview-fallback__description'>{t('webviewLimitHint')}</Text>
          <Button className='primary-button' onClick={() => void copyExternalUrl(url)}>{t('webviewCopyLink')}</Button>
        </View>
      </PageShell>
    )
  }

  return <WebView src={url} onError={() => setFailed(true)} />
}
