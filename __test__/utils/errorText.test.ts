/* eslint-disable import/first */
// 只借 i18n 的译文；完整加载会顺带拉起 stores/app → api/client → Taro 运行时。
jest.mock('@/stores/app', () => ({
  useAppStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ settings: { locale: 'zh-CN' } }),
    { getState: () => ({ settings: { locale: 'zh-CN' } }) },
  ),
}))

import { describeError } from '@/utils/errorText'
import { translate } from '@/i18n'
import type { MessageKey } from '@/i18n'

const t = (key: MessageKey, params?: Record<string, string | number>) => translate('zh-CN', key, params)
const en = (key: MessageKey, params?: Record<string, string | number>) => translate('en', key, params)

class FakeError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
  }
}

describe('error text', () => {
  test('localizes transport failures instead of leaking Chinese diagnostics', () => {
    expect(describeError(new FakeError('网络请求失败', 0), en)).toBe(translate('en', 'networkError'))
    expect(describeError(new FakeError('登录已过期，请重新登录', 401), en)).toBe(translate('en', 'pleaseLoginEduAccount'))
    expect(describeError(new FakeError('请求失败（500）', 503), en)).toBe(translate('en', 'requestFailed', { status: 503 }))
  })

  test('passes backend business messages through untouched', () => {
    expect(describeError(new FakeError('余额不足', 400), t)).toBe('余额不足')
    expect(describeError(new FakeError('反馈内容太短', 422), t)).toBe('反馈内容太短')
  })

  test('falls back to the generic message for unknown throwables', () => {
    expect(describeError(undefined, t)).toBe(translate('zh-CN', 'loadFailed'))
    expect(describeError('boom', t)).toBe(translate('zh-CN', 'loadFailed'))
    expect(describeError(new Error(''), t)).toBe(translate('zh-CN', 'loadFailed'))
  })
})
