import { create } from 'zustand'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getBusSnapshot, getElectricitySnapshot, getPaymentSnapshot } from '@/services/domainRepository'
import { readStorage, STORAGE_KEYS } from '@/utils/storage'

/**
 * 首页磁贴用的摘要数据。
 *
 * 对应 Flutter 的 electricityStore / busTileStore / paymentStore 三个 store，
 * 小程序这边磁贴数量少、状态也简单，合成一个 store 更省事。
 *
 * 每个磁贴各自 try/catch：一个服务挂了不该让其它磁贴停在 loading。
 */

function today(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** 电费余额低于这个值按「余额不足」高亮，与 Flutter 磁贴一致。 */
const LOW_BALANCE_THRESHOLD = 10

export { LOW_BALANCE_THRESHOLD }

interface TileDataState {
  electricity: { isLoading: boolean; balance: number | null; hasConfiguredSource: boolean }
  bus: { isLoading: boolean; count: number }
  payment: { isLoading: boolean; balance: number | null; hasData: boolean; error: string }

  loadElectricity: () => Promise<void>
  loadBus: () => Promise<void>
  loadPayment: () => Promise<void>
}

export const useTileDataStore = create<TileDataState>((set) => ({
  electricity: { isLoading: true, balance: null, hasConfiguredSource: false },
  bus: { isLoading: true, count: 0 },
  payment: { isLoading: true, balance: null, hasData: false, error: '' },

  loadElectricity: async () => {
    const session = useAuthStore.getState().session
    if (!session) {
      set({ electricity: { isLoading: false, balance: null, hasConfiguredSource: false } })
      return
    }
    const schoolCode = useAppStore.getState().school.code
    const sourceUrl = readStorage(STORAGE_KEYS.ELECTRICITY_URL, '')
    try {
      const snapshot = await getElectricitySnapshot(session.username, schoolCode, sourceUrl, 'local-first')
      set({
        electricity: {
          isLoading: false,
          balance: snapshot.data.balance,
          hasConfiguredSource: sourceUrl.trim().length > 0 || snapshot.data.balance !== null,
        },
      })
      if (snapshot.isFromLocal) {
        // 先渲染缓存，再后台拉一次最新的。
        const refreshed = await getElectricitySnapshot(session.username, schoolCode, sourceUrl, 'refresh')
        set({ electricity: { isLoading: false, balance: refreshed.data.balance, hasConfiguredSource: true } })
      }
    } catch {
      set({ electricity: { isLoading: false, balance: null, hasConfiguredSource: sourceUrl.trim().length > 0 } })
    }
  },

  loadBus: async () => {
    if (!useAuthStore.getState().session) {
      set({ bus: { isLoading: false, count: 0 } })
      return
    }
    const schoolCode = useAppStore.getState().school.code
    try {
      const snapshot = await getBusSnapshot(today(), schoolCode, 'local-first')
      set({ bus: { isLoading: false, count: snapshot.data.length } })
      if (snapshot.isFromLocal) {
        const refreshed = await getBusSnapshot(today(), schoolCode, 'refresh')
        set({ bus: { isLoading: false, count: refreshed.data.length } })
      }
    } catch {
      set({ bus: { isLoading: false, count: 0 } })
    }
  },

  loadPayment: async () => {
    const session = useAuthStore.getState().session
    const cardId = readStorage(STORAGE_KEYS.PAYMENT_ID, session?.username ?? '')
    if (!session || !cardId.trim()) {
      set({ payment: { isLoading: false, balance: null, hasData: false, error: '' } })
      return
    }
    const schoolCode = useAppStore.getState().school.code
    try {
      // 小程序不持久化查询密码，磁贴只用卡号取数；接口需要密码时会把错误回传上来。
      const snapshot = await getPaymentSnapshot(cardId, '', schoolCode, 'local-first')
      set({ payment: { isLoading: false, balance: snapshot.data.balance, hasData: true, error: '' } })
      if (snapshot.isFromLocal) {
        const refreshed = await getPaymentSnapshot(cardId, '', schoolCode, 'refresh')
        set({ payment: { isLoading: false, balance: refreshed.data.balance, hasData: true, error: '' } })
      }
    } catch (error) {
      set({
        payment: {
          isLoading: false,
          balance: null,
          hasData: false,
          error: error instanceof Error ? error.message : '',
        },
      })
    }
  },
}))

/**
 * 只加载当前学校支持、且已显示的磁贴数据。
 */
export async function loadVisibleTileData(tileIds: string[]): Promise<void> {
  const features = useAppStore.getState().school.features
  const { loadElectricity, loadBus, loadPayment } = useTileDataStore.getState()
  const tasks: Promise<void>[] = []

  if (tileIds.includes('electricity') && features.includes('electricity')) tasks.push(loadElectricity())
  if (tileIds.includes('bus') && features.includes('bus_schedule')) tasks.push(loadBus())
  if (tileIds.includes('payment') && features.includes('payment')) tasks.push(loadPayment())

  await Promise.allSettled(tasks)
}
