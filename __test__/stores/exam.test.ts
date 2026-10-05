/* eslint-disable import/first */
const mockGetExamSnapshot = jest.fn()

jest.mock('@/services/examRepository', () => ({
  getExamSnapshot: (...args: unknown[]) => mockGetExamSnapshot(...args),
}))

jest.mock('@/stores/auth', () => {
  const state: { session: unknown } = { session: null }
  return {
    __auth: state,
    useAuthStore: Object.assign(
      (selector: (value: unknown) => unknown) => selector(state),
      {
        getState: () => state,
        subscribe: () => () => {},
      },
    ),
  }
})

jest.mock('@/stores/app', () => {
  const state = { school: { code: 'XAUAT' } }
  return {
    __app: state,
    useAppStore: Object.assign(
      (selector: (value: unknown) => unknown) => selector(state),
      { getState: () => state },
    ),
  }
})

import { useExamStore } from '@/stores/exam'

const auth = (jest.requireMock('@/stores/auth') as { __auth: { session: unknown } }).__auth

const EXAM = { id: 'e1', name: '高等数学', time: '2026-01-05 09:00-11:00', location: '教1-101', seat: '12' }

describe('exam store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useExamStore.setState({ exams: [], isLoading: false, error: '' })
    auth.session = { username: '2026123456', educationId: '84721', cookie: 'c', schoolCode: 'XAUAT' }
  })

  test('clears everything when there is no session', async () => {
    auth.session = null
    useExamStore.setState({ exams: [EXAM] })

    await useExamStore.getState().load()

    expect(useExamStore.getState().exams).toEqual([])
    expect(mockGetExamSnapshot).not.toHaveBeenCalled()
  })

  test('loads exams for the signed-in scope', async () => {
    mockGetExamSnapshot.mockResolvedValue({ data: [EXAM], isFromLocal: false, isStale: false })

    await useExamStore.getState().load('refresh')

    expect(mockGetExamSnapshot).toHaveBeenCalledWith('84721', 'XAUAT', 'refresh')
    expect(useExamStore.getState().exams).toEqual([EXAM])
    expect(useExamStore.getState().error).toBe('')
  })

  test('keeps the loading flag while exams are already on screen', async () => {
    useExamStore.setState({ exams: [EXAM] })
    mockGetExamSnapshot.mockResolvedValue({ data: [EXAM], isFromLocal: false, isStale: false })

    const pending = useExamStore.getState().load('refresh')
    expect(useExamStore.getState().isLoading).toBe(false)
    await pending
  })

  test('surfaces the failure without dropping the exams already loaded', async () => {
    useExamStore.setState({ exams: [EXAM] })
    mockGetExamSnapshot.mockRejectedValue(new Error('offline'))

    await useExamStore.getState().load('refresh')

    expect(useExamStore.getState().exams).toEqual([EXAM])
    expect(useExamStore.getState().error).toBe('offline')
    expect(useExamStore.getState().isLoading).toBe(false)
  })
})
