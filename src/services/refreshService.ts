import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useExamStore } from '@/stores/exam'
import { useScoreStore } from '@/stores/score'
import { useStudyProgressStore } from '@/stores/studyProgress'
import { fetchScheduleTimeFromRemote } from '@/services/scheduleTimeRepository'

/**
 * 全局刷新编排。
 *
 * 对应 Flutter 的 `lib/features/education/services/education_refresh_service.dart`：
 * 设置页的「刷新数据」、各页下拉刷新都走这里，页面不再各写一套 load()。
 *
 * 与 Flutter 的差异：Flutter 的 `refresh()` 会先用本地存着的教务密码重新登录，
 * 小程序不保存密码（见隐私政策），所以这里只能用现有会话刷新；会话过期时
 * `api/client` 的 401 处理会把人踢回登录页。
 */

export interface RefreshOutcome {
  success: boolean
  /** 失败的任务名，调用方可以据此给出更具体的提示。 */
  failures: string[]
}

/**
 * 刷新所有已登录态的数据。
 *
 * 作息表单独先拉：课表的节次时间依赖它，而且是学校级数据（换学校才需要重取），
 * 与其他接口没有依赖关系，但先拿到能让课表首帧就是对的。
 */
export async function refreshAll(): Promise<RefreshOutcome> {
  const session = useAuthStore.getState().session
  if (!session) return { success: false, failures: ['auth_required'] }

  const schoolCode = useAppStore.getState().school.code
  const features = useAppStore.getState().school.features

  const tasks: Array<[string, Promise<unknown>]> = [
    ['scheduleTime', fetchScheduleTimeFromRemote(schoolCode, true)],
  ]

  if (features.includes('timetable')) {
    tasks.push(['courses', useCourseStore.getState().refresh(session.educationId, 'refresh')])
  }
  if (features.includes('grade_query')) {
    tasks.push(['scores', useScoreStore.getState().load(session.educationId, 'refresh')])
  }
  if (features.includes('exam_schedule')) {
    tasks.push(['exams', useExamStore.getState().load('refresh')])
  }
  if (features.includes('study_progress')) {
    tasks.push(['studyProgress', useStudyProgressStore.getState().load(session.username, 'refresh')])
  }

  const results = await Promise.allSettled(tasks.map(([, task]) => task))
  const failures = results
    .map((result, index) => (result.status === 'rejected' ? tasks[index][0] : null))
    .filter((name): name is string => name !== null)

  return { success: failures.length === 0, failures }
}
