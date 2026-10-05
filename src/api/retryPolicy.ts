/**
 * 请求重试策略，语义与 Flutter 的 `lib/core/services/retry_policy.dart` 一致：
 * 网络类错误和 5xx 才重试，4xx（含 401/403）不重试。
 */

export interface RetryPolicy {
  /** 最大重试次数（不含首次请求） */
  maxRetries: number
  /** 第 attempt 次重试前的等待毫秒数，attempt 从 0 起 */
  delayFactor: (attempt: number) => number
  /** 判断某个失败是否值得重试 */
  shouldRetry: (error: RetryableError) => boolean
}

/** 重试判断只看得到状态码：0 表示网络/超时类错误。 */
export interface RetryableError {
  statusCode: number
}

/** 默认延迟：指数退避 500ms、1000ms、1500ms… */
function defaultDelayFactor(attempt: number): number {
  return 500 * (attempt + 1)
}

/**
 * 网络超时/连接失败（statusCode 0）和服务器错误（5xx）重试；
 * 认证错误（401/403）和其他客户端错误（4xx）不重试。
 */
export function defaultShouldRetry(error: RetryableError): boolean {
  if (error.statusCode === 0) return true
  return error.statusCode >= 500
}

/** 默认策略：2 次重试。 */
export const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 2,
  delayFactor: defaultDelayFactor,
  shouldRetry: defaultShouldRetry,
}

/** 快速重试：3 次重试，延迟更短。 */
export const fastRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  delayFactor: (attempt) => 300 * (attempt + 1),
  shouldRetry: defaultShouldRetry,
}

/** 不重试。 */
export const noRetryPolicy: RetryPolicy = {
  maxRetries: 0,
  delayFactor: defaultDelayFactor,
  shouldRetry: () => false,
}

export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}
