import { apiGet } from '../client'
import type { ApiResponse, ReleaseInfo } from '@/types'

export function getReleaseInfo(): Promise<ApiResponse<ReleaseInfo>> {
  return apiGet('/api/v1/App')
}
