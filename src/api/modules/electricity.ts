import { apiGet, apiPost, apiDelete } from '../client'
import type { ApiResponse, ElectricDataPoint } from '@/types'

export function getElectricityBalance(): Promise<ApiResponse<number>> {
  return apiGet('/Electricity')
}

export function getWeeklyData(): Promise<ApiResponse<ElectricDataPoint[]>> {
  return apiGet('/Electricity/WeeklyData')
}

export function getRechargeUrl(): Promise<ApiResponse<string>> {
  return apiGet('/Electricity/RechargeUrl')
}

export function createSubscription(email: string): Promise<ApiResponse<unknown>> {
  return apiPost('/Electricity/Subscriptions', { email })
}

export function getSubscription(email: string): Promise<ApiResponse<unknown>> {
  return apiGet('/Electricity/Subscriptions', { email })
}

export function deleteSubscription(id: number): Promise<ApiResponse<unknown>> {
  return apiDelete(`/Electricity/Subscriptions/${id}`)
}
