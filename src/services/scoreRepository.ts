import { fetchScores, fetchSemesters } from '@/api/education'
import type { FetchPolicy, FetchSnapshot, ScoreList, Semester } from '@/types/domain'
import { normalizeScore, normalizeSemester } from '@/utils/education'
import { readCache, STORAGE_KEYS, writeCache } from '@/utils/storage'

const SCORE_TTL = 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord)
}

function scoreScope(studentId: string, schoolCode: string): string {
  return `${schoolCode.toUpperCase()}:${studentId}`
}

function readSemesters(studentId: string, schoolCode: string): Semester[] {
  const entry = readCache(STORAGE_KEYS.SEMESTERS, scoreScope(studentId, schoolCode), isRecordArray)
  return entry ? entry.data.map(normalizeSemester) : []
}

export function readScoreLists(studentId: string, schoolCode: string): ScoreList[] {
  const entry = readCache(STORAGE_KEYS.SCORES, scoreScope(studentId, schoolCode), isRecordArray)
  if (!entry) return []
  return entry.data.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (!record.semester || !Array.isArray(record.list)) return []
    return [{
      semester: normalizeSemester(record.semester as Record<string, unknown>),
      list: record.list
        .filter((score): score is Record<string, unknown> => Boolean(score && typeof score === 'object'))
        .map(normalizeScore),
    }]
  }).sort((left, right) => right.semester.value.localeCompare(left.semester.value))
}

async function refreshScores(studentId: string, schoolCode: string, cached: ScoreList[]): Promise<FetchSnapshot<ScoreList[]>> {
  let semesters: Semester[]
  try {
    semesters = await fetchSemesters(studentId)
    if (semesters.length) writeCache(STORAGE_KEYS.SEMESTERS, semesters, scoreScope(studentId, schoolCode), SCORE_TTL)
  } catch {
    semesters = readSemesters(studentId, schoolCode)
  }
  if (semesters.length === 0) {
    return { data: cached, isFromLocal: true, isStale: cached.length > 0 }
  }

  const cachedBySemester = new Map(cached.map((item) => [item.semester.value, item]))
  const results = await Promise.allSettled(
    semesters.map(async (semester) => ({ semester, list: await fetchScores(studentId, semester.value) })),
  )
  let fetchedAny = false
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    cachedBySemester.set(result.value.semester.value, result.value)
    fetchedAny = true
  }
  const data = [...cachedBySemester.values()].sort((left, right) => right.semester.value.localeCompare(left.semester.value))
  if (fetchedAny) writeCache(STORAGE_KEYS.SCORES, data, scoreScope(studentId, schoolCode), SCORE_TTL)
  return { data, isFromLocal: !fetchedAny, isStale: !fetchedAny && data.length > 0 }
}

export async function getScoreSnapshot(studentId: string, schoolCode: string, policy: FetchPolicy = 'local-first'): Promise<FetchSnapshot<ScoreList[]>> {
  const cached = readScoreLists(studentId, schoolCode)
  if (policy === 'local-first' && cached.length > 0) {
    return { data: cached, isFromLocal: true, isStale: false }
  }
  return refreshScores(studentId, schoolCode, cached)
}
