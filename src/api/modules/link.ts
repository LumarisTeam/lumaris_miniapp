import { apiGet } from '../client'
import type { ApiResponse, LinkItem } from '@/types'

export function getSchoolNav(): Promise<ApiResponse<LinkItem[]>> {
  return apiGet('/SchoolNav')
}
