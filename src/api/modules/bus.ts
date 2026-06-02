import { apiGet } from '../client'
import type { ApiResponse, BusItem } from '@/types'

export function getBusData(date: string): Promise<ApiResponse<BusItem[]>> {
  return apiGet(`/Bus/${date}`)
}
