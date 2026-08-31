import { useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { fetchPayment } from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import type { PaymentRecord } from '@/types/domain'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import '@/styles/pages.scss'
import './index.scss'

export default function PaymentPage() {
  const session = useAuthStore((state) => state.session)
  const [cardId, setCardId] = useState(() => readStorage(STORAGE_KEYS.PAYMENT_ID, session?.studentId || ''))
  const [password, setPassword] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!session || !cardId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchPayment(cardId.trim(), password || undefined)
      setBalance(data.balance)
      setRecords(data.records)
      writeStorage(STORAGE_KEYS.PAYMENT_ID, cardId.trim())
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '校园卡查询失败') }
    finally { setLoading(false) }
  }

  useDidShow(() => { if (session && cardId) void load() })
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })

  return (
    <PageShell title='校园卡' showBack>
      {!session ? <StateView state='login' title='登录后查询校园卡' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /> : (
        <>
          <View className='page-section'><ClubCard><Text className='electricity-balance__label'>当前余额</Text><Text className='payment-balance'>¥ {balance === null ? '--' : balance.toFixed(2)}</Text></ClubCard></View>
          <View className='page-section'><ClubCard>
            <Text className='form-label'>校园卡号</Text><Input className='form-input' value={cardId} onInput={(event) => setCardId(event.detail.value)} />
            <Text className='form-label'>查询密码（不会保存）</Text><Input className='form-input' value={password} password placeholder='如接口需要，请输入' onInput={(event) => setPassword(event.detail.value)} />
            {error ? <Text className='payment-error'>{error}</Text> : null}
            <Button className='primary-button payment-query' loading={loading} onClick={() => void load()}>查询流水</Button>
          </ClubCard></View>
          <View className='page-section'><SectionHeader title='近期流水' icon='list' trailing={`${records.length} 笔`} /><ClubCard padding='none'>
            {loading && records.length === 0 ? <StateView state='loading' compact title='正在查询流水' /> : records.length === 0 ? <StateView state='empty' compact title='暂无校园卡流水' /> : records.map((record) => <View className='payment-row' key={record.id}><View className='grow'><Text className='payment-row__title'>{record.description || record.turnoverType}</Text><Text className='payment-row__meta'>{record.datetime} · {record.turnoverType}</Text></View><Text className={`payment-row__amount ${record.amount >= 0 ? 'success' : ''}`}>{record.amount >= 0 ? '+' : ''}{record.amount.toFixed(2)}</Text></View>)}
          </ClubCard></View>
        </>
      )}
    </PageShell>
  )
}
