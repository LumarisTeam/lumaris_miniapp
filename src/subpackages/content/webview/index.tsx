import { useState } from 'react'
import { Button, Text, View, WebView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { copyExternalUrl } from '@/utils/platform'
import '@/styles/pages.scss'
import './index.scss'

export default function WebViewPage() {
  const router = useRouter()
  const url = decodeURIComponent(router.params.url || '')
  const [failed, setFailed] = useState(!/^https?:\/\//.test(url))

  if (failed) {
    return (
      <PageShell title='网页无法打开' showBack>
        <View className='webview-fallback'><Text className='webview-fallback__title'>此网页不在微信业务域名中</Text><Text className='webview-fallback__description'>复制链接后可使用系统浏览器访问。</Text><Button className='primary-button' onClick={() => void copyExternalUrl(url)}>复制链接</Button></View>
      </PageShell>
    )
  }

  return <WebView src={url} onError={() => setFailed(true)} />
}
