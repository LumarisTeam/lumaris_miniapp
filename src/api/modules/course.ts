import { apiGet } from '../client'
import type { ApiResponse, Course } from '@/types'

export function getCourses(studentId: string): Promise<ApiResponse<{ courses: Course[]; error?: string }>> {
  return apiGet('/Course', { studentId })
}
