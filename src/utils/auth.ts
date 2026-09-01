import type { AuthSession, LoginResult, School } from '@/types/domain'

export function createAuthSession(
  username: string,
  result: LoginResult,
  school: School,
): AuthSession | null {
  const normalizedUsername = username.trim()
  const educationId = result.studentId?.trim()
  const cookie = result.cookie?.trim()

  if (!normalizedUsername || result.success !== true || !educationId || !cookie) {
    return null
  }

  return {
    username: normalizedUsername,
    educationId,
    cookie,
    schoolCode: school.code,
  }
}
