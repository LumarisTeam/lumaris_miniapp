import type { Score, ScoreList } from '@/types/domain'
import { applyFoolishMode, calculateScoreListsSummary, groupByAcademicYear } from '@/utils/education'

function score(name: string, over: Partial<Score> = {}): Score {
  return {
    id: name,
    name,
    lessonCode: name,
    lessonName: name,
    grade: '80',
    gpa: '3',
    gradeDetail: '',
    credit: '2',
    isMinor: false,
    ...over,
  }
}

function semester(value: string, names: string[]): ScoreList {
  return { semester: { value, text: value }, list: names.map((name) => score(`${name}@${value}`)) }
}

describe('academic year grouping', () => {
  test('pairs semesters into years oldest-first, exactly like Flutter', () => {
    // scoreLists 按学期倒序（最新在前），学年列表从最旧的学期开始两两合并，
    // 所以第 0 项是「大一」而最后一项是最近一年——这是 Flutter 的既有顺序。
    const lists = [
      semester('2027-1', ['a']),
      semester('2026-2', ['b', 'c']),
      semester('2026-1', ['d']),
      semester('2025-2', ['e']),
    ]

    const years = groupByAcademicYear(lists)

    expect(years).toHaveLength(2)
    expect(years[0].semester.value).toBe('2025-2')
    expect(years[0].list.map((item) => item.name)).toEqual(['e@2025-2', 'd@2026-1'])
    expect(years[1].semester.value).toBe('2026-2')
    expect(years[1].list.map((item) => item.name)).toEqual(['b@2026-2', 'c@2026-2', 'a@2027-1'])
  })

  test('keeps a lone trailing semester as its own year', () => {
    const years = groupByAcademicYear([semester('2026-1', ['a']), semester('2025-2', ['b']), semester('2025-1', ['c'])])
    expect(years).toHaveLength(2)
    expect(years[1].list).toHaveLength(1)
  })

  test('does not mutate the source lists', () => {
    const lists = [semester('2026-1', ['a']), semester('2025-2', ['b'])]
    groupByAcademicYear(lists)

    expect(lists[0].list).toHaveLength(1)
    expect(lists[1].list).toHaveLength(1)
  })

  test('returns nothing for no semesters', () => {
    expect(groupByAcademicYear([])).toEqual([])
  })
})

describe('foolish mode', () => {
  test('maxes out every displayed score', () => {
    const lists = [semester('2026-1', ['a', 'b'])]

    const foolish = applyFoolishMode(lists)

    for (const item of foolish[0].list) {
      expect(item).toMatchObject({ grade: '100', gpa: '5', gradeDetail: '666' })
    }
  })

  test('leaves the original data untouched', () => {
    const lists = [semester('2026-1', ['a'])]

    applyFoolishMode(lists)

    expect(lists[0].list[0]).toMatchObject({ grade: '80', gpa: '3' })
  })

  test('feeds the stats card as well, so GPA never disagrees with the list', () => {
    // Flutter 是原地改模型，统计卡看到的就是改过的值；这条守住同样的口径。
    const lists = [semester('2026-1', ['a', 'b'])]

    expect(calculateScoreListsSummary(applyFoolishMode(lists)).weightedGpa).toBe(5)
    expect(calculateScoreListsSummary(lists).weightedGpa).toBe(3)
  })
})
