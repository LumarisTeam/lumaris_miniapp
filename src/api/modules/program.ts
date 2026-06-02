import { apiGet } from '../client'
import type { ApiResponse, PlanCourse } from '@/types'

export function getProgram(id: string, name: string): Promise<ApiResponse<PlanCourse[]>> {
  return apiGet('/Program', { id, name })
}

export function getProgramDic(id: string): Promise<ApiResponse<{ value: string; text: string }[]>> {
  return apiGet('/Program/GetDic', { id })
}
