import Taro from '@tarojs/taro'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'

/**
 * 匿名反馈的客户端约定。
 *
 * 后端契约与 Flutter 的 `feedback_sdk` 一致（LumarisTeam/feedback_sdk）：
 * 请求统一带 `X-Client-ID`，图片走 presign → PUT → confirm 三步，提交带幂等的
 * `request_id`，`extra` 里带产品线与环境信息。
 */

export const FEEDBACK_BASE_URL = 'https://feedbackapi.luckyfishes.site'
/** 产品线标识，写入 extra.app_name；光序 = lumaris。 */
export const FEEDBACK_APP_NAME = 'lumaris'
/** 后端限制：最多 6 张图片、描述 2000 字、联系方式 128 字。 */
export const FEEDBACK_MAX_IMAGES = 6
export const FEEDBACK_MAX_CONTENT = 2000
export const FEEDBACK_MAX_CONTACT = 128
/** 提交时记录页面来源，方便后端定位问题。 */
export const FEEDBACK_PAGE = 'FeedbackPage'

function randomHex(length: number): string {
  const bytes = new Uint8Array(length)
  const cryptoObject = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoObject && typeof cryptoObject.getRandomValues === 'function') {
    cryptoObject.getRandomValues(bytes)
  } else {
    for (let index = 0; index < length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 幂等用的 request_id（UUID v4 形状）。
 *
 * 提交失败重试时要复用同一个值；内容一旦改动就换新的，由调用方负责。
 */
export function createRequestId(): string {
  const hex = randomHex(16)
  const variant = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/**
 * 匿名设备标识。
 *
 * 对齐 SDK 的 `ClientIdStore`：首次生成后持久化，绝不每次请求重新生成；卸载重装
 * 才会变。
 */
export function getOrCreateClientId(): string {
  const existing = readStorage(STORAGE_KEYS.FEEDBACK_CLIENT_ID, '')
  if (existing) return existing
  const created = createRequestId()
  writeStorage(STORAGE_KEYS.FEEDBACK_CLIENT_ID, created)
  return created
}

/** 由文件名推 MIME，小程序选择器只会给出 jpg/png 这类常见后缀。 */
export function guessMimeType(filename: string): string {
  const extension = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
  switch (extension) {
    case 'png': return 'image/png'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    case 'heic': return 'image/heic'
    case 'bmp': return 'image/bmp'
    default: return 'image/jpeg'
  }
}

/** 文件名取不到或没有后缀时补一个，后端要求 filename 非空。 */
export function normalizeFilename(filename: string, now = Date.now()): string {
  const trimmed = filename.trim()
  if (trimmed && /\.[a-z0-9]+$/i.test(trimmed)) return trimmed
  return `feedback_${now}.jpg`
}

export interface FeedbackEnvironment {
  school: string
  appVersion: string
  appEnv: string
  osVersion: string
  deviceModel: string
  platform: string
}

/** 采集环境信息；任何一项取不到都只是留空，不影响提交。 */
export function collectEnvironment(school: string): FeedbackEnvironment {
  let appVersion = ''
  let appEnv = ''
  let osVersion = ''
  let deviceModel = ''
  let platform = 'weapp'

  try {
    const account = Taro.getAccountInfoSync?.()
    appVersion = account?.miniProgram?.version ?? ''
    appEnv = account?.miniProgram?.envVersion ?? ''
  } catch {
    // 部分宿主（H5/测试环境）没有账号信息接口。
  }

  try {
    const system = Taro.getSystemInfoSync()
    osVersion = system.system ?? ''
    deviceModel = [system.brand, system.model].filter(Boolean).join(' ')
    platform = system.platform ?? platform
  } catch {
    // 取不到就留空。
  }

  return { school, appVersion, appEnv, osVersion, deviceModel, platform }
}

/**
 * 组装提交用的 `extra`。
 *
 * 空值不写入——后端把 extra 原样存下来，写一堆空字段只会让排查更乱。
 */
export function buildFeedbackExtra(environment: FeedbackEnvironment, page = FEEDBACK_PAGE): Record<string, string> {
  const extra: Record<string, string> = {
    app_name: FEEDBACK_APP_NAME,
    page,
    platform: environment.platform,
  }
  if (environment.school) extra.school = environment.school
  if (environment.appVersion) extra.app_version = environment.appVersion
  if (environment.appEnv) extra.app_env = environment.appEnv
  if (environment.osVersion) extra.os_version = environment.osVersion
  if (environment.deviceModel) extra.device_model = environment.deviceModel
  return extra
}
