import Taro from '@tarojs/taro'
import {
  FEEDBACK_BASE_URL,
  getOrCreateClientId,
  guessMimeType,
  normalizeFilename,
} from '@/utils/feedback'

/**
 * 匿名反馈后端。
 *
 * 与 Flutter `feedback_sdk` 的 `FeedbackApi` 同一套接口：
 *
 *   POST /api/v1/uploads/presign   {filename, size, mime_type} → file_key / upload_url
 *   PUT  <upload_url>              原样带 Content-Type（签名绑定了它）
 *   POST /api/v1/uploads/confirm   {file_key} → attachment_id
 *   POST /api/v1/feedbacks         {request_id, content, contact, attachment_ids, extra}
 *
 * 这个域不吃教务的 xauat 会话，所以不走 `@/api/client`，只带 `X-Client-ID`。
 */

const TIMEOUT = 15000

export class FeedbackError extends Error {
  constructor(message: string, public readonly statusCode = 0) {
    super(message)
    this.name = 'FeedbackError'
  }
}

function clientHeader(): Record<string, string> {
  return { 'X-Client-ID': getOrCreateClientId(), 'Content-Type': 'application/json' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/** 后端返回 `{code, message, data}`；code 非 0 时 message 已经是可以直接展示的文案。 */
function readData(response: { statusCode: number; data: unknown }): unknown {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    const envelope = response.data
    const message = isRecord(envelope) && typeof envelope.message === 'string' && envelope.message
      ? envelope.message
      : `反馈服务返回 ${response.statusCode}`
    throw new FeedbackError(message, response.statusCode)
  }

  const envelope = response.data
  if (isRecord(envelope) && ('code' in envelope || 'data' in envelope)) {
    // 出错时后端只给 code + message，不保证带 data 字段，所以要单独看 code。
    const code = envelope.code
    if (code !== undefined && ![0, 200, '0', '200', 'success'].includes(code as never)) {
      throw new FeedbackError(typeof envelope.message === 'string' ? envelope.message : '反馈服务返回异常', response.statusCode)
    }
    return 'data' in envelope ? envelope.data : envelope
  }
  return envelope
}

async function postJson(path: string, data: Record<string, unknown>): Promise<unknown> {
  let response: { statusCode: number; data: unknown }
  try {
    response = await Taro.request<unknown>({
      url: `${FEEDBACK_BASE_URL}${path}`,
      method: 'POST',
      data,
      header: clientHeader(),
      timeout: TIMEOUT,
    })
  } catch (error) {
    throw new FeedbackError(error instanceof Error ? error.message : '网络异常')
  }
  return readData(response)
}

/** 读取本地临时文件为 ArrayBuffer——PUT 到 COS 需要原始字节。 */
function readFile(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      Taro.getFileSystemManager().readFile({
        filePath,
        success: (result) => {
          const data = result.data
          if (data instanceof ArrayBuffer) resolve(data)
          else reject(new FeedbackError('无法读取所选图片'))
        },
        fail: () => reject(new FeedbackError('无法读取所选图片')),
      })
    } catch {
      reject(new FeedbackError('无法读取所选图片'))
    }
  })
}

/** 上传一张图片，返回 attachment_id。 */
export async function uploadFeedbackImage(filePath: string, filename: string): Promise<number> {
  const name = normalizeFilename(filename)
  const bytes = await readFile(filePath)
  const contentType = guessMimeType(name)

  const presign = await postJson('/api/v1/uploads/presign', {
    filename: name,
    size: bytes.byteLength,
    mime_type: contentType,
  })
  if (!isRecord(presign) || typeof presign.file_key !== 'string' || typeof presign.upload_url !== 'string') {
    throw new FeedbackError('上传凭证无效')
  }

  const headers = isRecord(presign.headers) ? presign.headers : {}
  const signedContentType = typeof headers['Content-Type'] === 'string' ? headers['Content-Type'] : contentType

  try {
    const put = await Taro.request<unknown>({
      url: presign.upload_url,
      method: 'PUT',
      data: bytes,
      // 签名绑定了 content-type，必须用 presign 返回的那个，否则 COS 会 403。
      header: { 'Content-Type': signedContentType },
      timeout: TIMEOUT,
    })
    if (put.statusCode < 200 || put.statusCode >= 300) {
      throw new FeedbackError(`图片上传失败（${put.statusCode}）`, put.statusCode)
    }
  } catch (error) {
    if (error instanceof FeedbackError) throw error
    throw new FeedbackError(error instanceof Error ? error.message : '图片上传失败')
  }

  const confirmed = await postJson('/api/v1/uploads/confirm', { file_key: presign.file_key })
  if (!isRecord(confirmed) || typeof confirmed.attachment_id !== 'number') {
    throw new FeedbackError('图片确认失败')
  }
  return confirmed.attachment_id
}

export interface SubmitFeedbackInput {
  requestId: string
  content: string
  contact: string
  attachmentIds: number[]
  extra: Record<string, string>
}

/** 提交反馈，返回 feedback_no。 */
export async function submitFeedback(input: SubmitFeedbackInput): Promise<string> {
  const data = await postJson('/api/v1/feedbacks', {
    request_id: input.requestId,
    content: input.content,
    contact: input.contact,
    attachment_ids: input.attachmentIds,
    extra: input.extra,
  })
  if (!isRecord(data) || typeof data.feedback_no !== 'string') {
    throw new FeedbackError('反馈提交失败')
  }
  return data.feedback_no
}
