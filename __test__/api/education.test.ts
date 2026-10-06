/* eslint-disable import/first */
const mockRequest = jest.fn()

jest.mock('@/api/client', () => ({
  request: (...args: unknown[]) => mockRequest(...args),
  withQuery: (path: string, params: Record<string, unknown>) => {
    const query = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&')
    return query ? `${path}?${query}` : path
  },
}))

import {
  fetchBusNewData,
  fetchBusOldData,
  fetchCourses,
  fetchElectricityWeekly,
  fetchLinks,
  fetchMapPois,
  fetchProgram,
  fetchProgramList,
  fetchScheduleTime,
  fetchScores,
} from '@/api/education'

describe('Flutter education API fixtures', () => {
  beforeEach(() => mockRequest.mockReset())

  test('uses the login response education id for education endpoints', async () => {
    mockRequest.mockResolvedValueOnce([]).mockResolvedValueOnce([])

    await fetchCourses('84721')
    await fetchScores('84721', '2026-1')

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/Course?studentId=84721')
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/Score?studentId=84721&semester=2026-1')
  })

  test('preserves and sorts SchoolNav categories and their links', async () => {
    mockRequest.mockResolvedValue([
      { key: 'life', name: '生活', icon: 'home', index: 2, links: [{ key: 'b', name: '后勤', url: 'https://b', index: 2 }, { key: 'a', name: '一卡通', url: 'https://a', index: 1 }] },
      { key: 'study', name: '学习', icon: 'book', index: 1, links: [] },
    ])
    const categories = await fetchLinks()
    expect(categories.map((item) => item.key)).toEqual(['study', 'life'])
    expect(categories[1].links.map((item) => item.key)).toEqual(['a', 'b'])
  })

  test('reads Flutter map snake_case fields and excludes inactive POIs', async () => {
    mockRequest.mockResolvedValue([
      { id: '2', name: '停用地点', category: '教学', latitude: '34.2', longitude: '108.9', is_active: false, sort_order: '1' },
      { id: '1', name: '图书馆', category: '学习', latitude: '34.3', longitude: '108.8', is_active: true, sort_order: '2' },
    ])
    await expect(fetchMapPois()).resolves.toEqual([expect.objectContaining({ id: '1', name: '图书馆', sortOrder: '2' })])
  })

  test('requests the schedule time table and folds PascalCase fields', async () => {
    mockRequest.mockResolvedValue([
      { CampusName: '草堂校区', Time: '', Start: ['08:00', '08:30'], End: ['08:20', '09:15'] },
      { CampusName: '雁塔校区', Time: '05/01~09/30', Start: ['09:00'], End: ['09:45'] },
    ])

    await expect(fetchScheduleTime()).resolves.toEqual([
      { campusName: '草堂校区', timeRange: '', start: ['08:00', '08:30'], end: ['08:20', '09:15'] },
      { campusName: '雁塔校区', timeRange: '05/01~09/30', start: ['09:00'], end: ['09:45'] },
    ])
    expect(mockRequest).toHaveBeenCalledWith('/course/ScheduleTime')
  })

  test('passes the Flutter bus new/old data query parameters', async () => {
    mockRequest.mockResolvedValue([])
    await fetchBusNewData('2026-09-01', '草堂校区')
    await fetchBusOldData('2026-09-01', true)
    expect(mockRequest).toHaveBeenNthCalledWith(1, '/Bus/NewData/2026-09-01?loc=草堂校区')
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/Bus/OldData/2026-09-01?isShow=true')
  })

  test('reads the flat program list with either field casing', async () => {
    mockRequest.mockResolvedValue([{ Name: '高等数学', CourseTypeName: '公共课', Credits: '4' }])
    await expect(fetchProgramList('84721')).resolves.toEqual([
      expect.objectContaining({ name: '高等数学', courseTypeName: '公共课', credits: 4 }),
    ])
  })

  test('accepts API casing variants preserved by Flutter models', async () => {
    mockRequest.mockResolvedValueOnce([{ Timestamp: '2026-09-01T08:00:00', Value: '1.25' }])
    await expect(fetchElectricityWeekly()).resolves.toEqual([{ timestamp: '2026-09-01T08:00:00', value: 1.25 }])
    mockRequest.mockResolvedValueOnce({ '大一上': [{ Name: '高等数学', LessonType: '必修', ExamMode: '考试', CourseTypeName: '公共课', Credits: '4' }] })
    await expect(fetchProgram('1')).resolves.toEqual([expect.objectContaining({ name: '高等数学', credits: 4, term: '大一上' })])
  })
})
