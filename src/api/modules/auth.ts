import { apiPost } from '../client'
import type { ApiResponse, LoginResponse } from '@/types'

export function login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return apiPost('/Login', { username, password })
}
