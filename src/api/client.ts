import type { ApiResponse } from '@/types'
import { getStorage, STORAGE_KEYS } from '@/utils/storage'

const BASE_URL = 'https://xauatapi.xauat.site/v1'

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'DELETE'
  data?: Record<string, unknown>
  header?: Record<string, string>
  showLoading?: boolean
}

interface Interceptor {
  onRequest?: (config: RequestConfig) => RequestConfig
  onResponse?: (response: { statusCode: number; data: ApiResponse<unknown> }) => void
  onError?: (error: { statusCode: number; data: ApiResponse<unknown> }) => void
}

let globalInterceptor: Interceptor | null = null
let reLoginLock: Promise<boolean> | null = null
let isRelogging = false
let reLoginFn: (() => Promise<boolean>) | null = null

export function setInterceptor(interceptor: Interceptor) {
  globalInterceptor = interceptor
}

export function setReLoginFn(fn: () => Promise<boolean>) {
  reLoginFn = fn
}

export function registerReLogin(fn: () => Promise<boolean>) {
  reLoginFn = fn
}

function getAuthHeaders() {
  const userData = getStorage<{ cookie?: string }>(STORAGE_KEYS.USER_DATA)
  const cookie = userData?.cookie?.trim()

  if (!cookie) {
    return {}
  }

  const headers: Record<string, string> = {
    xauat: cookie,
  }

  // H5 forbids setting the Cookie header manually, but the backend also accepts `xauat`.
  // #ifndef H5
  headers.Cookie = cookie
  // #endif

  return headers
}

function buildHeaders(header: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...header,
  }
}

export async function request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  let finalConfig = { ...config }
  if (globalInterceptor?.onRequest) {
    finalConfig = globalInterceptor.onRequest(finalConfig)
  }
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
  } = finalConfig

  if (showLoading) {
    uni.showLoading({ title: '', mask: true })
  }

  try {
    const response = await new Promise<{
      statusCode: number
      data: ApiResponse<T>
    }>((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method,
        header: buildHeaders(header),
        data,
        success: (res) => {
          resolve({ statusCode: res.statusCode, data: res.data as ApiResponse<T> })
        },
        fail: (err) => {
          reject(err)
        },
      })
    })

    if (showLoading) {
      uni.hideLoading()
    }

    globalInterceptor?.onResponse?.(response as { statusCode: number; data: ApiResponse<unknown> })

    if ((response.statusCode === 401 || response.statusCode === 403) && reLoginFn) {
      if (!isRelogging) {
        isRelogging = true
        reLoginLock = reLoginFn().finally(() => {
          isRelogging = false
          reLoginLock = null
        })
      }
      await reLoginLock

      const retryResponse = await new Promise<{
        statusCode: number
        data: ApiResponse<T>
      }>((resolve, reject) => {
        uni.request({
          url: BASE_URL + url,
          method,
          header: buildHeaders(header),
          data,
          success: (res) => {
            resolve({ statusCode: res.statusCode, data: res.data as ApiResponse<T> })
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
      globalInterceptor?.onResponse?.(retryResponse as { statusCode: number; data: ApiResponse<unknown> })
      return retryResponse.data
    }

    return response.data
  } catch (error) {
    if (showLoading) {
      uni.hideLoading()
    }
    if (typeof error === 'object' && error && 'statusCode' in error && 'data' in error) {
      globalInterceptor?.onError?.(error as { statusCode: number; data: ApiResponse<unknown> })
    }
    throw error
  }
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number>,
): Promise<ApiResponse<T>> {
  const queryString = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  return request<T>({ url: url + queryString, method: 'GET' })
}

export async function apiPost<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'POST', data })
}

export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'DELETE' })
}
