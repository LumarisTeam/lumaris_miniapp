import Taro from '@tarojs/taro'
import type { ApiResponse, AuthSession, School } from '@/types/domain'
import { readStorage, STORAGE_KEYS } from '@/utils/storage'

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  data?: Record<string, unknown>
  basic?: boolean
  authenticated?: boolean
}

function isEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return Boolean(value && typeof value === 'object' && 'data' in (value as Record<string, unknown>))
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = readStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null)
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.authenticated !== false && session?.cookie) header.xauat = session.cookie

  try {
    const response = await Taro.request<unknown>({
      url: `${options.basic ? BASIC_API_BASE_URL : educationApiBaseUrl()}${path}`,
      method: options.method ?? 'GET',
      data: options.data,
      header,
      timeout: REQUEST_TIMEOUT,
    })

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
  } catch (error) {
    if (error instanceof ApiError) throw error
    const message = error instanceof Error ? error.message : '网络请求失败'
    throw new ApiError(message)
  }
}

export function withQuery(path: string, params: Record<string, unknown>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `${path}?${query}` : path
}
