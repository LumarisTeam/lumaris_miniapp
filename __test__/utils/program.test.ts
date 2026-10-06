/* eslint-disable import/first */
// i18n 会顺带加载 stores/app → api/client → Taro 运行时，在 jest 里跑不起来；
// 这里只借用它的译文，所以按 i18n 测试的做法把 store 换掉。
jest.mock('@/stores/app', () => ({
  useAppStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ settings: { locale: 'zh-CN' } }),
    { getState: () => ({ settings: { locale: 'zh-CN' } }) },
  ),
}))

import { groupProgramTerms, programTermLabel } from '@/utils/program'
import { translate } from '@/i18n'
import type { PlanCourse } from '@/types/domain'

const t = (key: Parameters<typeof translate>[1]) => translate('zh-CN', key)

function course(term: string, name: string): PlanCourse {
  return { id: `${term}-${name}`, name, lessonType: '', examMode: '', courseTypeName: '公共课', credits: 3, term }
}

describe('program helpers', () => {
  test('builds the same semester labels as Flutter program_page_notifier', () => {
    expect(programTermLabel('1', t)).toBe('大一上')
    expect(programTermLabel('2', t)).toBe('大一下')
    expect(programTermLabel('3', t)).toBe('大二上')
    expect(programTermLabel('8', t)).toBe('大四下')
    expect(programTermLabel('10', t)).toBe('大五下')
  })

  test('keeps non-numeric and malformed terms verbatim', () => {
    expect(programTermLabel('特殊分组', t)).toBe('特殊分组')
    expect(programTermLabel('', t)).toBe('')
    expect(programTermLabel('0', t)).toBe('0')
    expect(programTermLabel('1.5', t)).toBe('1.5')
  })

  test('sorts numeric terms ascending and pushes the rest to the end', () => {
    const groups = groupProgramTerms([
      course('特殊分组', '军训'),
      course('2', '线性代数'),
      course('10', '毕业设计'),
      course('1', '高等数学'),
      course('1', '大学英语'),
    ])
    expect(groups.map((group) => group.term)).toEqual(['1', '2', '10', '特殊分组'])
    expect(groups[0].courses.map((item) => item.name)).toEqual(['高等数学', '大学英语'])
  })

  test('groups courses without a term under an empty key', () => {
    expect(groupProgramTerms([course('', '未分学期')]).map((group) => group.term)).toEqual([''])
  })
})
