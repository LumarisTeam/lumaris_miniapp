import { apiGet } from '../client'
import type { ApiResponse, StudyModule } from '@/types'

export function getInfoCompletion(): Promise<ApiResponse<StudyModule[]>> {
  return apiGet('/Info/Completion')
}

export function getInfoTime(): Promise<ApiResponse<{ startDate: string; endDate: string; currentWeek: number }>> {
  return apiGet('/Info/Time')
}
