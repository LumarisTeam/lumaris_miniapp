/* eslint-disable import/first */
const mockRequest = jest.fn()

jest.mock('@/api/client', () => ({
  request: (...args: unknown[]) => mockRequest(...args),
}))

import { fetchAppReleases, listSchools, fetchSchoolDetail, normalizeSchool } from '@/api/basic'

/** 2026-10-05 取自 https://luminous.xauat.site/api/v1/schools 的真实响应片段。 */
const liveSchool = {
  code: 'XAUAT',
  name: '西安建筑科技大学',
  website: 'https://xauatapi.xauat.site/v1',
  edu_system_url: 'https://swjw.xauat.edu.cn/student/login?refer=https://swjw.xauat.edu.cn/student/home',
  features: ['login', 'timetable', 'course_schedule', 'grade_query', 'gpa_calculation', 'exam_schedule', 'bus_schedule', 'program', 'study_progress', 'electricity', 'payment', 'map'],
  enabled: true,
  week_start_day: 0,
  created_at: '2026-06-05T23:01:56.606883Z',
  updated_at: '2026-09-16T12:15:16.574098Z',
}

describe('basic API', () => {
  beforeEach(() => mockRequest.mockReset())

  test('reads nested items from the schools envelope', async () => {
    mockRequest.mockResolvedValue({ total: 1, items: [liveSchool] })

    const schools = await listSchools()

    expect(mockRequest).toHaveBeenCalledWith('/api/v1/schools', { basic: true, authenticated: false })
    expect(schools).toEqual([{
      code: 'XAUAT',
      name: '西安建筑科技大学',
      website: 'https://xauatapi.xauat.site/v1',
      eduSystemUrl: 'https://swjw.xauat.edu.cn/student/login?refer=https://swjw.xauat.edu.cn/student/home',
      features: liveSchool.features,
      enabled: true,
      weekStartDay: 7,
      createdAt: '2026-06-05T23:01:56.606883Z',
      updatedAt: '2026-09-16T12:15:16.574098Z',
    }])
  })

  test('accepts a bare array as well', async () => {
    mockRequest.mockResolvedValue([liveSchool])
    await expect(listSchools()).resolves.toHaveLength(1)
  })

  test('maps Go week_start_day 0 to Sunday and 1 to Monday', () => {
    expect(normalizeSchool({ week_start_day: 0 }).weekStartDay).toBe(7)
    expect(normalizeSchool({ week_start_day: 1 }).weekStartDay).toBe(1)
    expect(normalizeSchool({}).weekStartDay).toBe(7)
  })

  test('drops unknown features instead of failing the whole list', () => {
    // Flutter 的 Feature.fromValue 遇到未知值会抛错；小程序必须容忍服务端先行上新功能。
    const school = normalizeSchool({ features: ['login', 'brand_new_feature', 42, null] })
    expect(school.features).toEqual(['login'])
  })

  test('falls back to the default school when fields are missing', () => {
    expect(normalizeSchool({})).toMatchObject({
      code: 'XAUAT',
      name: '西安建筑科技大学',
      website: 'https://xauatapi.xauat.site',
      eduSystemUrl: '',
      features: [],
      enabled: true,
      weekStartDay: 7,
    })
  })

  test('treats an explicit enabled:false as disabled', () => {
    expect(normalizeSchool({ enabled: false }).enabled).toBe(false)
  })

  test('uppercases and encodes the school code for the detail endpoint', async () => {
    mockRequest.mockResolvedValue(liveSchool)

    await fetchSchoolDetail(' xauat ')

    expect(mockRequest).toHaveBeenCalledWith('/api/v1/schools/XAUAT', { basic: true, authenticated: false })
  })

  test('normalizes releases and sorts them newest first', async () => {
    mockRequest.mockResolvedValue({
      total: 2,
      items: [
        { id: 1, tag_name: '1.2.0', name: '1.2.0', body: 'old', created_at: '2026-01-01T00:00:00Z', assets: [] },
        {
          id: 2,
          tag_name: '1.2.1',
          name: '1.2.1',
          body: '1. 已知问题优化\n2. 加入反馈中心',
          created_at: '2026-09-04T00:00:00Z',
          assets: [{ name: 'release_android', browser_download_url: 'https://appapi.xauat.site/app.apk' }],
        },
      ],
    })

    const releases = await fetchAppReleases()

    expect(mockRequest).toHaveBeenCalledWith('/api/v1/app', { basic: true, authenticated: false })
    expect(releases.map((release) => release.tagName)).toEqual(['1.2.1', '1.2.0'])
    expect(releases[0].assets).toEqual([{ name: 'release_android', browserDownloadUrl: 'https://appapi.xauat.site/app.apk' }])
  })
})
