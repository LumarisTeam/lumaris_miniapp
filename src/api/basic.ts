import { request } from '@/api/client'
import type { Feature, ReleaseInfo, School } from '@/types/domain'

/**
 * 基础服务（不需要教务登录）：学校目录与应用发布信息。
 *
 * 对应 Flutter 的 `features/basic/services/school_api.dart` 与 `app_api.dart`，
 * 走 basic 基址而不是教务 API 基址。
 */

/** 服务端认识的 feature 值，与 Flutter 的 Feature 枚举一一对应。 */
const KNOWN_FEATURES: Feature[] = [
  'timetable',
  'grade_query',
  'gpa_calculation',
  'course_schedule',
  'exam_schedule',
  'login',
  'bus_schedule',
  'program',
  'study_progress',
  'electricity',
  'payment',
  'map',
]

const KNOWN_FEATURE_SET = new Set<string>(KNOWN_FEATURES)

/**
 * 只保留服务端认识的功能开关。
 *
 * Flutter 的 `Feature.fromValue` 遇到未知值会抛错，这里改成丢弃——小程序是
 * 热更新的，服务端先上新功能不该让整个学校列表拿不到。
 */
function normalizeFeatures(value: unknown): Feature[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Feature => typeof item === 'string' && KNOWN_FEATURE_SET.has(item))
}

/** 服务端用 0 表示周日（Go 约定），内部统一成 1(周一) / 7(周日)。 */
function normalizeWeekStartDay(value: unknown): 1 | 7 {
  return value === 1 ? 1 : 7
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function normalizeSchool(raw: Record<string, unknown>): School {
  return {
    code: asString(raw.code, 'XAUAT'),
    name: asString(raw.name, '西安建筑科技大学'),
    website: asString(raw.website, 'https://xauatapi.xauat.site'),
    eduSystemUrl: asString(raw.edu_system_url),
    features: normalizeFeatures(raw.features),
    enabled: raw.enabled !== false,
    weekStartDay: normalizeWeekStartDay(raw.week_start_day),
    createdAt: asString(raw.created_at),
    updatedAt: asString(raw.updated_at),
  }
}

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

/** GET /api/v1/schools → 学校列表（带 total/items 包装，也兼容裸数组）。 */
export async function listSchools(): Promise<School[]> {
  const response = await request<{ items?: unknown[] } | unknown[]>('/api/v1/schools', {
    basic: true,
    authenticated: false,
  })
  const items = Array.isArray(response) ? response : response?.items ?? []
  return asRecords(items).map(normalizeSchool)
}

/** GET /api/v1/schools/{code} → 学校详情，含最新的功能开关。 */
export async function fetchSchoolDetail(code: string): Promise<School> {
  const raw = await request<Record<string, unknown>>(`/api/v1/schools/${encodeURIComponent(code.trim().toUpperCase())}`, {
    basic: true,
    authenticated: false,
  })
  return normalizeSchool(raw ?? {})
}

function normalizeAssets(value: unknown) {
  return asRecords(value).map((asset) => ({
    name: asString(asset.name),
    browserDownloadUrl: asString(asset.browser_download_url),
  }))
}

/** GET /api/v1/app → 应用发布信息，按发布时间倒序。 */
export async function fetchAppReleases(): Promise<ReleaseInfo[]> {
  const response = await request<{ items?: unknown[] } | unknown[]>('/api/v1/app', {
    basic: true,
    authenticated: false,
  })
  const items = Array.isArray(response) ? response : response?.items ?? []
  return asRecords(items)
    .map((raw) => ({
      id: Number(raw.id ?? 0),
      tagName: asString(raw.tag_name),
      name: asString(raw.name),
      body: asString(raw.body),
      createdAt: asString(raw.created_at),
      assets: normalizeAssets(raw.assets),
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
