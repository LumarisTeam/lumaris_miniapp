import Taro from '@tarojs/taro'
import type { ApiResponse, AuthSession, School } from '@/types/domain'
import { readStorage, STORAGE_KEYS } from '@/utils/storage'
import { defaultRetryPolicy, sleep, type RetryPolicy } from '@/api/retryPolicy'

const API_BASE_URL = process.env.TARO_APP_API_BASE_URL || 'https://xauatapi.xauat.site/v1'
const BASIC_API_BASE_URL = process.env.TARO_APP_BASIC_API_BASE_URL || 'https://xauatapi.xauat.site'
const REQUEST_TIMEOUT = 15000

function educationApiBaseUrl(): string {
  const school = readStorage<School | null>(STORAGE_KEYS.SCHOOL, null)
  const website = school?.website?.trim().replace(/\/+$/, '')
  if (!website) return API_BASE_URL
  return website.endsWith('/v1') ? website : `${website}/v1`
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 0,
    public readonly code: number | string = statusCode,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  data?: Record<string, unknown>
  basic?: boolean
  authenticated?: boolean
  /** 覆盖默认超时（毫秒） */
  timeout?: number
  /** 覆盖默认重试策略；传 noRetryPolicy 可关闭重试 */
  retryPolicy?: RetryPolicy
}

function isEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return Boolean(value && typeof value === 'object' && 'data' in (value as Record<string, unknown>))
}

/** 单次请求：不做重试，把各类失败统一成 ApiError 抛出。 */
async function performRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const session = readStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null)
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.authenticated !== false && session?.cookie) header.xauat = session.cookie

  let response: { statusCode: number; data: unknown }
  try {
    response = await Taro.request<unknown>({
      url: `${options.basic ? BASIC_API_BASE_URL : educationApiBaseUrl()}${path}`,
      method: options.method ?? 'GET',
      data: options.data,
      header,
      timeout: options.timeout ?? REQUEST_TIMEOUT,
    })
  } catch (error) {
    // 网络失败/超时：statusCode 记为 0，重试策略据此判定可重试。
    const message = error instanceof Error ? error.message : '网络请求失败'
    throw new ApiError(message)
  }

  if (response.statusCode === 401 || response.statusCode === 403) {
    unauthorizedHandler?.()
    throw new ApiError('登录已过期，请重新登录', response.statusCode)
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiError(`请求失败（${response.statusCode}）`, response.statusCode)
  }

  if (!isEnvelope<T>(response.data)) return response.data as T
  const envelope = response.data
  const code = envelope.code
  if (code !== undefined && ![0, 200, '0', '200', 'success'].includes(code)) {
    throw new ApiError(envelope.message || '服务返回异常', response.statusCode, code)
  }
  return envelope.data
}

/**
 * 发起一次教务/基础 API 请求。
 *
 * 失败时按 [RequestOptions.retryPolicy]（默认 2 次、指数退避）重试；只有网络
 * 类错误和 5xx 会重试，401/403 和其他 4xx 直接抛出。
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const policy = options.retryPolicy ?? defaultRetryPolicy

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await performRequest<T>(path, options)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('网络请求失败')
      if (attempt >= policy.maxRetries || !policy.shouldRetry(apiError)) {
        throw apiError
      }
      await sleep(policy.delayFactor(attempt))
    }
  }
}

export function withQuery(path: string, params: Record<string, unknown>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `${path}?${query}` : path
}
