import { apiGet } from '../client'
import type { ApiResponse, StudyModule, TimeInfo } from '@/types'
import { normalizeTimeInfo } from '@/utils/education'

export function getInfoCompletion(): Promise<ApiResponse<StudyModule[]>> {
  return apiGet('/Info/Completion')
}

export async function getInfoTime(): Promise<ApiResponse<TimeInfo>> {
  const response = await apiGet<Record<string, unknown>>('/Info/Time')
  return {
    ...response,
    data: response.data ? normalizeTimeInfo(response.data) : normalizeTimeInfo({}),
  }
}
