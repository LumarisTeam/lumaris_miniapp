import type { MessageKey, Translator } from '@/i18n'
import type { PlanCourse } from '@/types/domain'
import { academicYearKey } from '@/utils/education'

/**
 * 培养方案的学期分组。
 *
 * 服务端 `/Program/GetDic` 的 key 是学期序号（"1"…"10"），Flutter 的
 * `ProgramPageNotifier.semesterNames` 直接按下标取写死的「大一上」表；这里改成由
 * `year1…year10` 加学期后缀的文案键拼出来，非数字的 key（服务端自定义分组，例如
 * 「特殊分组」）按原样展示并排在最后。
 */

/** 学期序号（1 起）对应的「大一上」这类标签。非数字 term 原样返回。 */
export function programTermLabel(term: string, t: Translator): string {
  const index = Number(term)
  if (!Number.isInteger(index) || index <= 0) return term
  const year = t(academicYearKey(Math.floor((index - 1) / 2)))
  const half: MessageKey = index % 2 === 1 ? 'semesterAutumnShort' : 'semesterSpringShort'
  return `${year}${t(half)}`
}

export interface ProgramTermGroup {
  term: string
  courses: PlanCourse[]
}

/** 按学期分组：数字 term 升序在前，非数字 term 保持原顺序排在最后。 */
export function groupProgramTerms(courses: PlanCourse[]): ProgramTermGroup[] {
  const groups = new Map<string, PlanCourse[]>()
  for (const course of courses) {
    const term = course.term || ''
    groups.set(term, [...(groups.get(term) ?? []), course])
  }

  const numeric = (term: string): number | null => {
    const index = Number(term)
    return Number.isInteger(index) && index > 0 ? index : null
  }

  return [...groups.entries()]
    .map(([term, items]) => ({ term, courses: items }))
    .sort((left, right) => {
      const leftIndex = numeric(left.term)
      const rightIndex = numeric(right.term)
      if (leftIndex !== null && rightIndex !== null) return leftIndex - rightIndex
      if (leftIndex !== null) return -1
      if (rightIndex !== null) return 1
      return 0
    })
}
