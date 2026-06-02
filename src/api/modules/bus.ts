import { apiGet } from '../client'
import type { ApiResponse, BusItem } from '@/types'
import { normalizeBusItem } from '@/utils/education'

export function getBusData(date: string): Promise<ApiResponse<BusItem[]>> {
  return apiGet<Record<string, unknown>[]>(`/Bus/${date}`).then((response) => ({
    ...response,
    data: Array.isArray(response.data) ? response.data.map((item, index) => normalizeBusItem(item, index)) : [],
  }))
}
