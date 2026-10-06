/* eslint-disable import/first */
const mockRefreshCourses = jest.fn()
const mockLoadScores = jest.fn()
const mockLoadExams = jest.fn()
const mockLoadProgress = jest.fn()
const mockFetchScheduleTime = jest.fn()
const session = { username: '2026123456', educationId: '84721', cookie: 'c', schoolCode: 'XAUAT' }

// jest.mock 的工厂会被提升到 import 之前，所以这里只能引用 mock 前缀的变量；
// 工厂返回的是闭包，真正的读取发生在测试运行时。
jest.mock('@/stores/auth', () => ({
  useAuthStore: { getState: () => ({ session: mockSession.value }) },
}))
jest.mock('@/stores/app', () => ({
  useAppStore: { getState: () => ({ school: { code: 'XAUAT', features: mockFeatures.value } }) },
}))
jest.mock('@/stores/course', () => ({ useCourseStore: { getState: () => ({ refresh: mockRefreshCourses }) } }))
jest.mock('@/stores/score', () => ({ useScoreStore: { getState: () => ({ load: mockLoadScores }) } }))
jest.mock('@/stores/exam', () => ({ useExamStore: { getState: () => ({ load: mockLoadExams }) } }))
jest.mock('@/stores/studyProgress', () => ({ useStudyProgressStore: { getState: () => ({ load: mockLoadProgress }) } }))
jest.mock('@/services/scheduleTimeRepository', () => ({
  fetchScheduleTimeFromRemote: (...args: unknown[]) => mockFetchScheduleTime(...args),
}))

const mockSession: { value: typeof session | null } = { value: session }
const mockFeatures: { value: string[] } = { value: ['timetable', 'grade_query', 'exam_schedule', 'study_progress'] }

import { refreshAll } from '@/services/refreshService'

describe('refresh orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.value = session
    mockFeatures.value = ['timetable', 'grade_query', 'exam_schedule', 'study_progress']
    mockRefreshCourses.mockResolvedValue(undefined)
    mockLoadScores.mockResolvedValue(undefined)
    mockLoadExams.mockResolvedValue(undefined)
    mockLoadProgress.mockResolvedValue(undefined)
    mockFetchScheduleTime.mockResolvedValue(undefined)
  })

  test('refreshes every logged-in dataset and forces a remote schedule table', async () => {
    await expect(refreshAll()).resolves.toEqual({ success: true, failures: [] })

    expect(mockFetchScheduleTime).toHaveBeenCalledWith('XAUAT', true)
    expect(mockRefreshCourses).toHaveBeenCalledWith('84721', 'refresh')
    expect(mockLoadScores).toHaveBeenCalledWith('84721', 'refresh')
    expect(mockLoadExams).toHaveBeenCalledWith('refresh')
    // 学业进度接口本身不带 id，学号只用来分缓存 scope。
    expect(mockLoadProgress).toHaveBeenCalledWith('2026123456', 'refresh')
  })

  test('skips features the school does not support', async () => {
    mockFeatures.value = ['timetable']
    await expect(refreshAll()).resolves.toEqual({ success: true, failures: [] })
    expect(mockLoadScores).not.toHaveBeenCalled()
    expect(mockLoadExams).not.toHaveBeenCalled()
    expect(mockLoadProgress).not.toHaveBeenCalled()
  })

  test('reports which datasets failed without aborting the others', async () => {
    mockLoadScores.mockRejectedValue(new Error('offline'))
    await expect(refreshAll()).resolves.toEqual({ success: false, failures: ['scores'] })
    expect(mockRefreshCourses).toHaveBeenCalled()
    expect(mockLoadExams).toHaveBeenCalled()
  })

  test('does nothing for a guest', async () => {
    mockSession.value = null
    await expect(refreshAll()).resolves.toEqual({ success: false, failures: ['auth_required'] })
    expect(mockFetchScheduleTime).not.toHaveBeenCalled()
  })
})
