import { apiGet } from '../client'
import type { ApiResponse, ScoreItem, Semester } from '@/types'

export function getSemesters(studentId: string): Promise<ApiResponse<Semester[]>> {
  return apiGet('/Score/Semester', { studentId })
}

export function getScores(studentId: string, semester: string): Promise<ApiResponse<ScoreItem[]>> {
  return apiGet('/Score', { studentId, semester })
}

export function getCurrentSemester(): Promise<ApiResponse<{ value: string; text: string }>> {
  return apiGet('/Score/ThisSemester')
}
