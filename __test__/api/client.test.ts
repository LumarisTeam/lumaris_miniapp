/* eslint-disable import/first */
const mockRequest = jest.fn()
const mockStorage: Record<string, unknown> = {
  'lumaris:v1:session': { studentId: '20260001', displayName: '同学', cookie: 'cookie-value', schoolCode: 'XAUAT' },
}

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    request: (...args: unknown[]) => mockRequest(...args),
    getStorageSync: jest.fn((key: string) => mockStorage[key] ?? ''),
  },
}))

import { ApiError, request, setUnauthorizedHandler, withQuery } from '@/api/client'

describe('API client', () => {
  beforeEach(() => mockRequest.mockReset())

  test('unwraps successful envelopes and adds session header', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, message: 'ok', data: { value: 42 } } })
    await expect(request<{ value: number }>('/example')).resolves.toEqual({ value: 42 })
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ header: expect.objectContaining({ xauat: 'cookie-value' }) }))
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

  test('encodes query values and skips empty fields', () => {
    expect(withQuery('/Score', { studentId: '2026 001', semester: '秋季', empty: '' })).toBe('/Score?studentId=2026%20001&semester=%E7%A7%8B%E5%AD%A3')
  })
})
