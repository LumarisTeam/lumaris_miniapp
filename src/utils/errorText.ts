import type { Translator } from '@/i18n'

/**
 * 把异常翻译成可以直接展示给用户的文字。
 *
 * 传输层的失败（超时、断网、5xx）在 `api/client` 与 `api/feedback` 里只有一句中文
 * 诊断信息，直接铺到界面上会让英文用户看到中文。这里按状态码换成当前语言的文案；
 * 后端返回的业务错误 message 本来就是给用户看的，原样透传。
 */

function statusOf(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const status = (error as { statusCode?: unknown }).statusCode
  return typeof status === 'number' ? status : null
}

export function describeError(error: unknown, t: Translator): string {
  const status = statusOf(error)

  if (status === 0) return t('networkError')
  if (status === 401 || status === 403) return t('pleaseLoginEduAccount')
  if (status !== null && status >= 500) return t('requestFailed', { status })

  if (error instanceof Error && error.message) return error.message
  return t('loadFailed')
}
