import { apiGet } from '../client'
import type { ApiResponse, Course } from '@/types'
import { normalizeCourse } from '@/utils/education'

export async function getCourses(studentId: string): Promise<ApiResponse<Course[]>> {
  const response = await apiGet<Record<string, unknown>[]>('/Course', { studentId })
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.map((course) => normalizeCourse(course)) : [],
  }
}
