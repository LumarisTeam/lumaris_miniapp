import { apiGet } from '../client'
import type { ApiResponse, ExamItem } from '@/types'

export function getExams(studentId: string): Promise<ApiResponse<{ exams: ExamItem[]; canClick: boolean; error?: string }>> {
  return apiGet('/Exam', { studentId })
}
