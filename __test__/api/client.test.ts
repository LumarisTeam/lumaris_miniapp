/* eslint-disable import/first */
const mockRequest = jest.fn()
const mockStorage: Record<string, unknown> = {
  'lumaris:v1:session': { username: '2026123456', educationId: '84721', cookie: 'cookie-value', schoolCode: 'XAUAT' },
}

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    request: (...args: unknown[]) => mockRequest(...args),
    getStorageSync: jest.fn((key: string) => mockStorage[key] ?? ''),
  },
}))

import { ApiError, request, setUnauthorizedHandler, withQuery } from '@/api/client'
import { defaultShouldRetry, fastRetryPolicy, noRetryPolicy, type RetryPolicy } from '@/api/retryPolicy'

const instantPolicy: RetryPolicy = { maxRetries: 2, delayFactor: () => 0, shouldRetry: defaultShouldRetry }

describe('API client', () => {
  beforeEach(() => mockRequest.mockReset())

  test('unwraps successful envelopes and adds session header', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: { value: 42 } } })
    await expect(request<{ value: number }>('/example')).resolves.toEqual({ value: 42 })
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ header: expect.objectContaining({ xauat: 'cookie-value' }) }))
  })

  test('routes education requests through the selected school endpoint', async () => {
    mockStorage['lumaris:v1:school'] = { website: 'https://school.example.edu/', code: 'DEMO' }
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: [] } })
    await request('/Course')
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://school.example.edu/v1/Course' }))
    delete mockStorage['lumaris:v1:school']
  })

  test('routes basic requests to the standalone basic service', async () => {
    // 回归：basic 基址曾经错写成教务 API 的 xauatapi.xauat.site，
    // 导致 /api/v1/schools 一直 404、学校列表永远只有兜底那一项。
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: [] } })

    await request('/api/v1/schools', { basic: true, authenticated: false })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://luminous.xauat.site/api/v1/schools', header: { 'Content-Type': 'application/json' } }),
    )
  })

  test('invokes unauthorized handler on 401', async () => {
    const handler = jest.fn()
    setUnauthorizedHandler(handler)
    mockRequest.mockResolvedValue({ statusCode: 401, data: {} })
    await expect(request('/secure')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('rejects non-success business codes', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 5001, message: '业务错误', data: null } })
    await expect(request('/failure')).rejects.toMatchObject({ message: '业务错误', code: 5001 })
  })

  test('retries network failures and resolves once a later attempt succeeds', async () => {
    mockRequest
      .mockRejectedValueOnce(new Error('request:fail timeout'))
      .mockRejectedValueOnce(new Error('request:fail timeout'))
      .mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: { value: 7 } } })

    await expect(request<{ value: number }>('/flaky', { retryPolicy: instantPolicy })).resolves.toEqual({ value: 7 })
    expect(mockRequest).toHaveBeenCalledTimes(3)
  })

  test('gives up after maxRetries and surfaces the last network error', async () => {
    mockRequest.mockRejectedValue(new Error('request:fail'))

    await expect(request('/down', { retryPolicy: instantPolicy })).rejects.toMatchObject({ statusCode: 0 })
    expect(mockRequest).toHaveBeenCalledTimes(3)
  })

  test('retries 5xx responses', async () => {
    mockRequest
      .mockResolvedValueOnce({ statusCode: 503, data: {} })
      .mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: 'recovered' } })

    await expect(request('/server-error', { retryPolicy: instantPolicy })).resolves.toBe('recovered')
    expect(mockRequest).toHaveBeenCalledTimes(2)
  })

  test('does not retry auth failures and runs the unauthorized handler once', async () => {
    const handler = jest.fn()
    setUnauthorizedHandler(handler)
    mockRequest.mockResolvedValue({ statusCode: 403, data: {} })

    await expect(request('/secure', { retryPolicy: fastRetryPolicy })).rejects.toMatchObject({ statusCode: 403 })
    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('does not retry other client errors or business-code failures', async () => {
    mockRequest.mockResolvedValueOnce({ statusCode: 404, data: {} })
    await expect(request('/missing', { retryPolicy: instantPolicy })).rejects.toMatchObject({ statusCode: 404 })

    mockRequest.mockReset()
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 5001, message: '业务错误', data: null } })
    await expect(request('/business', { retryPolicy: instantPolicy })).rejects.toMatchObject({ code: 5001 })
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  test('honours a policy that disables retries', async () => {
    mockRequest.mockRejectedValue(new Error('request:fail'))

    await expect(request('/once', { retryPolicy: noRetryPolicy })).rejects.toBeInstanceOf(ApiError)
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  test('passes the default timeout and lets callers override it', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: null } })

    await request('/timed')
    expect(mockRequest).toHaveBeenLastCalledWith(expect.objectContaining({ timeout: 15000 }))

    await request('/timed', { timeout: 3000 })
    expect(mockRequest).toHaveBeenLastCalledWith(expect.objectContaining({ timeout: 3000 }))
  })

  test('encodes query values and skips empty fields', () => {
    expect(withQuery('/Score', { studentId: '2026 001', semester: '秋季', empty: '' })).toBe('/Score?studentId=2026%20001&semester=%E7%A7%8B%E5%AD%A3')
  })
})

describe('retry policy', () => {
  test('retries network errors and server errors only', () => {
    expect(defaultShouldRetry({ statusCode: 0 })).toBe(true)
    expect(defaultShouldRetry({ statusCode: 500 })).toBe(true)
    expect(defaultShouldRetry({ statusCode: 503 })).toBe(true)
    expect(defaultShouldRetry({ statusCode: 401 })).toBe(false)
    expect(defaultShouldRetry({ statusCode: 403 })).toBe(false)
    expect(defaultShouldRetry({ statusCode: 404 })).toBe(false)
  })

  test('backs off linearly by attempt', () => {
    expect([0, 1, 2].map((attempt) => fastRetryPolicy.delayFactor(attempt))).toEqual([300, 600, 900])
  })
})
