import { apiGet } from '../client'
import type { ApiResponse, ScoreItem, Semester } from '@/types'
import { normalizeSemester } from '@/utils/education'

export async function getSemesters(studentId: string): Promise<ApiResponse<Semester[]>> {
  const response = await apiGet<Record<string, unknown>[]>('/Score/Semester', { studentId })
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.map((semester) => normalizeSemester(semester)) : [],
  }
}

export function getScores(studentId: string, semester: string): Promise<ApiResponse<ScoreItem[]>> {
  return apiGet('/Score', { studentId, semester })
}

export async function getCurrentSemester(): Promise<ApiResponse<Semester>> {
  const response = await apiGet<Record<string, unknown>>('/Score/ThisSemester')
  return {
    ...response,
    data: response.data ? normalizeSemester(response.data) : normalizeSemester({}),
  }
}
