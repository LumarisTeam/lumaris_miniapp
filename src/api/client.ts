import type { ApiResponse } from '@/types'

const BASE_URL = 'https://xauatapi.xauat.site'

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

export function setInterceptor(interceptor: Interceptor) {
  globalInterceptor = interceptor
}

export function setReLoginFn(fn: () => Promise<boolean>) {
  // Will be called when 401/403 detected
}

let reLoginFn: (() => Promise<boolean>) | null = null

export function registerReLogin(fn: () => Promise<boolean>) {
  reLoginFn = fn
}

export async function request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, header = {}, showLoading = false } = config

  let finalConfig = { ...config }
  if (globalInterceptor?.onRequest) {
    finalConfig = globalInterceptor.onRequest(finalConfig)
  }

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
        header: {
          'Content-Type': 'application/json',
          ...header,
        },
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
          header: {
            'Content-Type': 'application/json',
            ...header,
          },
          data,
          success: (res) => {
            resolve({ statusCode: res.statusCode, data: res.data as ApiResponse<T> })
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
      return retryResponse.data
    }

    return response.data
  } catch (error) {
    if (showLoading) {
      uni.hideLoading()
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
