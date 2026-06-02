import { apiGet } from '../client'
import type { ApiResponse, ExamItem } from '@/types'
import { normalizeExam } from '@/utils/education'

export async function getExams(studentId: string): Promise<ApiResponse<ExamItem[]>> {
  const response = await apiGet<Record<string, unknown>[]>('/Exam', { studentId })
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.map((exam) => normalizeExam(exam)) : [],
  }
}
