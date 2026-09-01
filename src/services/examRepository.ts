import { fetchExams } from '@/api/education'
import type { Exam, FetchPolicy, FetchSnapshot } from '@/types/domain'
import { isUpcomingExam, normalizeExam, parseExamEndTime } from '@/utils/education'
import { readCache, removeStorage, STORAGE_KEYS, writeCache } from '@/utils/storage'

const UPCOMING_TTL = 2 * 60 * 60 * 1000
const EMPTY_TTL = 24 * 60 * 60 * 1000

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
}

function scope(studentId: string, schoolCode: string): string {
  return `${schoolCode.toUpperCase()}:${studentId}`
}

function validSorted(exams: Exam[], now = new Date()): Exam[] {
  return exams.filter((exam) => isUpcomingExam(exam, now)).sort((left, right) => {
    return (parseExamEndTime(left.time)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseExamEndTime(right.time)?.getTime() ?? Number.MAX_SAFE_INTEGER)
  })
}

export function readExamSnapshot(studentId: string, schoolCode: string): FetchSnapshot<Exam[]> {
  const entry = readCache(STORAGE_KEYS.EXAMS, scope(studentId, schoolCode), isRecordArray)
  return {
    data: entry ? validSorted(entry.data.map(normalizeExam)) : [],
    isFromLocal: true,
    isStale: Boolean(entry && entry.expiresAt <= Date.now()),
  }
}

export async function getExamSnapshot(studentId: string, schoolCode: string, policy: FetchPolicy): Promise<FetchSnapshot<Exam[]>> {
  const local = readExamSnapshot(studentId, schoolCode)
  const entry = readCache(STORAGE_KEYS.EXAMS, scope(studentId, schoolCode), isRecordArray)
  if (policy === 'local-first' && entry && entry.expiresAt > Date.now()) return local
  try {
    const remote = await fetchExams(studentId)
    const merged = new Map<string, Exam>()
    for (const exam of [...local.data, ...remote]) merged.set(`${exam.name}_${exam.time}_${exam.location}`, exam)
    const data = validSorted([...merged.values()])
    if (data.length > 0) writeCache(STORAGE_KEYS.EXAMS, data, scope(studentId, schoolCode), UPCOMING_TTL)
    else writeCache(STORAGE_KEYS.EXAMS, [], scope(studentId, schoolCode), EMPTY_TTL)
    return { data, isFromLocal: false, isStale: false }
  } catch (error) {
    if (local.data.length > 0) return { data: local.data, isFromLocal: true, isStale: true }
    if (entry) return { data: [], isFromLocal: true, isStale: true }
    removeStorage(STORAGE_KEYS.EXAMS)
    throw error
  }
}
