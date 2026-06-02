import { apiGet } from '../client'
import type { ApiResponse, PaymentRecord } from '@/types'
import { normalizePaymentRecord, toNumber } from '@/utils/education'

export async function getPaymentRecords(
  id: string,
): Promise<
  ApiResponse<{ records: PaymentRecord[]; balance: number }>
> {
  const response = await apiGet<{ records?: Record<string, unknown>[]; balance?: string | number }>(
    `/Payment/${id}/turnover`,
  )

  return {
    ...response,
    data: {
      records: Array.isArray(response.data?.records)
        ? response.data.records.map((record) => normalizePaymentRecord(record))
        : [],
      balance: toNumber(response.data?.balance),
    },
  }
}

export function getPaymentInfo(
  id: string,
): Promise<
  ApiResponse<string>
> {
  return apiGet(`/Payment/${id}`)
}
