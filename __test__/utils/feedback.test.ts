/* eslint-disable import/first */
const mockStorage: Record<string, unknown> = {}
const mockAccountInfo = jest.fn()
const mockSystemInfo = jest.fn()

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    getStorageSync: jest.fn((key: string) => mockStorage[key] ?? ''),
    setStorageSync: jest.fn((key: string, value: unknown) => { mockStorage[key] = value }),
    removeStorageSync: jest.fn((key: string) => { delete mockStorage[key] }),
    getAccountInfoSync: (...args: unknown[]) => mockAccountInfo(...args),
    getSystemInfoSync: (...args: unknown[]) => mockSystemInfo(...args),
  },
}))

import {
  FEEDBACK_APP_NAME,
  buildFeedbackExtra,
  collectEnvironment,
  createRequestId,
  getOrCreateClientId,
  guessMimeType,
  normalizeFilename,
} from '@/utils/feedback'

describe('feedback helpers', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    mockAccountInfo.mockReturnValue({ miniProgram: { version: '1.4.2', envVersion: 'release' } })
    mockSystemInfo.mockReturnValue({ system: 'iOS 18.2', brand: 'Apple', model: 'iPhone 15', platform: 'ios' })
  })

  test('creates distinct UUID v4 shaped request ids', () => {
    const first = createRequestId()
    const second = createRequestId()
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(first).not.toBe(second)
  })

  test('persists one anonymous client id and reuses it', () => {
    const created = getOrCreateClientId()
    expect(created).toMatch(/^[0-9a-f-]{36}$/)
    mockStorage['lumaris:v1:feedback-client-id'] = created
    expect(getOrCreateClientId()).toBe(created)
  })

  test('guesses mime types and repairs missing extensions', () => {
    expect(guessMimeType('a.PNG')).toBe('image/png')
    expect(guessMimeType('a.webp')).toBe('image/webp')
    expect(guessMimeType('a.heic')).toBe('image/heic')
    expect(guessMimeType('a.bin')).toBe('image/jpeg')
    expect(normalizeFilename('wx-temp-file', 1700000000000)).toBe('feedback_1700000000000.jpg')
    expect(normalizeFilename('photo.jpg')).toBe('photo.jpg')
    expect(normalizeFilename('   ', 1700000000000)).toBe('feedback_1700000000000.jpg')
  })

  test('collects environment info and drops empty extra fields', () => {
    const environment = collectEnvironment('xauat')
    expect(environment).toEqual({
      school: 'xauat',
      appVersion: '1.4.2',
      appEnv: 'release',
      osVersion: 'iOS 18.2',
      deviceModel: 'Apple iPhone 15',
      platform: 'ios',
    })
    expect(buildFeedbackExtra(environment)).toEqual({
      app_name: FEEDBACK_APP_NAME,
      page: 'FeedbackPage',
      platform: 'ios',
      school: 'xauat',
      app_version: '1.4.2',
      app_env: 'release',
      os_version: 'iOS 18.2',
      device_model: 'Apple iPhone 15',
    })
  })

  test('survives hosts without account or system info', () => {
    mockAccountInfo.mockImplementation(() => { throw new Error('unsupported') })
    mockSystemInfo.mockImplementation(() => { throw new Error('unsupported') })
    const extra = buildFeedbackExtra(collectEnvironment(''))
    expect(extra).toEqual({ app_name: FEEDBACK_APP_NAME, page: 'FeedbackPage', platform: 'weapp' })
  })
})
