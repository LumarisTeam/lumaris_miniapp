import { apiGet } from '../client'
import type { ApiResponse, PaymentRecord } from '@/types'

export function getPaymentRecords(id: string): Promise<ApiResponse<PaymentRecord[]>> {
  return apiGet(`/Payment/${id}/turnover`)
}

export function getPaymentInfo(
  id: string,
): Promise<
  ApiResponse<{ records: PaymentRecord[]; balance: number }>
> {
  return apiGet(`/Payment/${id}`)
}
