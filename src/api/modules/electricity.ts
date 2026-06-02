import { apiGet, apiPost, apiDelete } from '../client'
import type { ApiResponse, ElectricDataPoint, ElectricitySubscriptionQueryResponse, ElectricitySubscriptionRequest } from '@/types'

/** 获取当前电费余额 */
export function getElectricityBalance(url?: string): Promise<ApiResponse<number>> {
  const params: Record<string, string> = {}
  if (url) params.url = url
  return apiGet('/Electricity', params)
}

/** 获取按小时聚合的周用电明细 */
export function getWeeklyData(url?: string): Promise<ApiResponse<ElectricDataPoint[]>> {
  const params: Record<string, string> = {}
  if (url) params.url = url
  return apiGet('/Electricity/WeeklyData', params)
}

/** 获取电费充值页面地址 */
export function getRechargeUrl(url?: string): Promise<ApiResponse<string>> {
  const params: Record<string, string> = {}
  if (url) params.url = url
  return apiGet('/Electricity/RechargeUrl', params)
}

/** 创建电费低余额订阅 */
export function createSubscription(
  request: ElectricitySubscriptionRequest,
): Promise<ApiResponse<unknown>> {
  return apiPost('/Electricity/Subscriptions', request as unknown as Record<string, unknown>)
}

/** 查询电费订阅状态 */
export function getSubscription(
  email: string,
): Promise<ApiResponse<ElectricitySubscriptionQueryResponse>> {
  return apiGet('/Electricity/Subscriptions', { email })
}

/** 删除电费订阅 */
export function deleteSubscription(id: string | number): Promise<ApiResponse<unknown>> {
  return apiDelete(`/Electricity/Subscriptions/${id}`)
}
