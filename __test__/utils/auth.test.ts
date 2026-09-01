import { createAuthSession } from '@/utils/auth'
import type { School } from '@/types/domain'

const school: School = {
  code: 'XAUAT',
  name: '西安建筑科技大学',
  website: 'https://xauatapi.xauat.site',
  features: ['login'],
  enabled: true,
  weekStartDay: 1,
}

describe('Flutter-compatible authentication identity', () => {
  test('keeps the login username separate from the response education id', () => {
    expect(createAuthSession(' 2026123456 ', {
      success: true,
      studentId: '84721',
      cookie: 'session-cookie',
    }, school)).toEqual({
      username: '2026123456',
      educationId: '84721',
      cookie: 'session-cookie',
      schoolCode: 'XAUAT',
    })
  })

  test('rejects an incomplete login payload', () => {
    expect(createAuthSession('2026123456', {
      success: true,
      studentId: '',
      cookie: 'session-cookie',
    }, school)).toBeNull()
  })
})
