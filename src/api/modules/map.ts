import { apiGet } from '../client'
import type { ApiResponse, MapPoi } from '@/types'

export function getMapData(): Promise<ApiResponse<MapPoi[]>> {
  return apiGet('/Map')
}
