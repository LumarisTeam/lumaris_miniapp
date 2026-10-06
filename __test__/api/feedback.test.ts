/* eslint-disable import/first */
const mockRequest = jest.fn()
const mockReadFile = jest.fn()
const mockStorage: Record<string, unknown> = {}

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    request: (...args: unknown[]) => mockRequest(...args),
    getStorageSync: jest.fn((key: string) => mockStorage[key] ?? ''),
    setStorageSync: jest.fn((key: string, value: unknown) => { mockStorage[key] = value }),
    removeStorageSync: jest.fn((key: string) => { delete mockStorage[key] }),
    getFileSystemManager: () => ({ readFile: (...args: unknown[]) => mockReadFile(...args) }),
  },
}))

import { FeedbackError, submitFeedback, uploadFeedbackImage } from '@/api/feedback'

const bytes = new ArrayBuffer(8)

describe('feedback API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    mockReadFile.mockImplementation(({ success }: { success: (result: { data: ArrayBuffer }) => void }) => success({ data: bytes }))
  })

  test('uploads through presign → PUT → confirm and returns the attachment id', async () => {
    mockRequest
      .mockResolvedValueOnce({ statusCode: 200, data: { code: 0, data: { file_key: 'k1', upload_url: 'https://cos.example/put', headers: { 'Content-Type': 'image/png' } } } })
      .mockResolvedValueOnce({ statusCode: 200, data: '' })
      .mockResolvedValueOnce({ statusCode: 200, data: { code: 0, data: { attachment_id: 77 } } })

    await expect(uploadFeedbackImage('wx://tmp/a.png', 'a.png')).resolves.toBe(77)

    expect(mockRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
      url: 'https://feedbackapi.luckyfishes.site/api/v1/uploads/presign',
      method: 'POST',
      data: { filename: 'a.png', size: 8, mime_type: 'image/png' },
      header: expect.objectContaining({ 'X-Client-ID': expect.stringMatching(/^[0-9a-f-]{36}$/) }),
    }))
    // PUT 必须一字不差地回传 presign 给的 content-type，否则 COS 会 403。
    expect(mockRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
      url: 'https://cos.example/put',
      method: 'PUT',
      data: bytes,
      header: { 'Content-Type': 'image/png' },
    }))
    expect(mockRequest).toHaveBeenNthCalledWith(3, expect.objectContaining({
      url: 'https://feedbackapi.luckyfishes.site/api/v1/uploads/confirm',
      data: { file_key: 'k1' },
    }))
  })

  test('falls back to the local mime type when presign sends no headers', async () => {
    mockRequest
      .mockResolvedValueOnce({ statusCode: 200, data: { data: { file_key: 'k2', upload_url: 'https://cos.example/put2' } } })
      .mockResolvedValueOnce({ statusCode: 200, data: '' })
      .mockResolvedValueOnce({ statusCode: 200, data: { data: { attachment_id: 1 } } })

    await uploadFeedbackImage('/tmp/b.jpg', 'b.jpg')
    expect(mockRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({ header: { 'Content-Type': 'image/jpeg' } }))
  })

  test('surfaces the backend message when a presigned PUT is rejected', async () => {
    mockRequest
      .mockResolvedValueOnce({ statusCode: 200, data: { data: { file_key: 'k3', upload_url: 'https://cos.example/put3', headers: { 'Content-Type': 'image/png' } } } })
      .mockResolvedValueOnce({ statusCode: 403, data: 'AccessDenied' })

    await expect(uploadFeedbackImage('/tmp/c.png', 'c.png')).rejects.toThrow(FeedbackError)
  })

  test('returns the feedback number and posts the idempotency key', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 0, data: { feedback_no: 'FB20260905' } } })

    await expect(submitFeedback({
      requestId: 'req-1',
      content: '内容',
      contact: 'a@b.com',
      attachmentIds: [1, 2],
      extra: { app_name: 'lumaris' },
    })).resolves.toBe('FB20260905')

    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://feedbackapi.luckyfishes.site/api/v1/feedbacks',
      method: 'POST',
      data: { request_id: 'req-1', content: '内容', contact: 'a@b.com', attachment_ids: [1, 2], extra: { app_name: 'lumaris' } },
    }))
  })

  test('turns a non-zero envelope code into a user-facing error', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 4001, message: '内容太短' } })
    await expect(submitFeedback({ requestId: 'r', content: 'x', contact: 'c', attachmentIds: [], extra: {} }))
      .rejects.toThrow('内容太短')
  })
})
