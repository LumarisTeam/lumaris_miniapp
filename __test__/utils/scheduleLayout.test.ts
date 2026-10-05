import type { Course } from '@/types/domain'
import {
  PERIOD_COUNT,
  coursesForPage,
  coursesForWeek,
  groupConflictingCourses,
  mergeSameNameCourses,
  weekStartForPage,
} from '@/utils/education'
import {
  COURSE_CARD_STYLES,
  courseCardFontSizes,
  courseCardStyleForSize,
} from '@/components/schedule/ScheduleCourseCard'

function course(overrides: Partial<Course> & Pick<Course, 'courseName' | 'startUnit' | 'endUnit'>): Course {
  return {
    id: `${overrides.courseName}-${overrides.startUnit}`,
    weekIndexes: [1],
    teachers: [],
    room: '',
    courseCode: '',
    weekday: 1,
    credits: '',
    lessonId: '',
    campus: '',
    color: '#007aff',
    isCustom: false,
    ...overrides,
  }
}

describe('course conflict handling', () => {
  test('merges same course and slot into one entry with both teachers', () => {
    const merged = mergeSameNameCourses([
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['张老师'] }),
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['李老师'] }),
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].teachers).toEqual(['张老师', '李老师'])
  })

  test('keeps the same course in different slots separate', () => {
    const merged = mergeSameNameCourses([
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['张老师'] }),
      course({ courseName: '大学英语', startUnit: 3, endUnit: 4, teachers: ['李老师'] }),
    ])

    expect(merged).toHaveLength(2)
    expect(merged.map((item) => item.teachers)).toEqual([['张老师'], ['李老师']])
  })

  test('does not duplicate a teacher listed twice', () => {
    const merged = mergeSameNameCourses([
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['张老师'] }),
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['张老师'] }),
    ])

    expect(merged[0].teachers).toEqual(['张老师'])
  })

  test('groups overlapping courses and leaves the rest alone', () => {
    const groups = groupConflictingCourses([
      course({ courseName: '高等数学', startUnit: 1, endUnit: 2 }),
      course({ courseName: '大学物理', startUnit: 2, endUnit: 3 }),
      course({ courseName: '体育', startUnit: 5, endUnit: 6 }),
    ])

    expect(groups.map((group) => group.map((item) => item.courseName))).toEqual([
      ['高等数学', '大学物理'],
      ['体育'],
    ])
  })

  test('merges same-name courses before grouping so they are not reported as a conflict', () => {
    const groups = groupConflictingCourses([
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['张老师'] }),
      course({ courseName: '大学英语', startUnit: 1, endUnit: 2, teachers: ['李老师'] }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(1)
    expect(groups[0][0].teachers).toEqual(['张老师', '李老师'])
  })

  test('treats touching boundaries as a conflict', () => {
    // 第 1-2 节与第 2-3 节共享第 2 节
    expect(groupConflictingCourses([
      course({ courseName: 'A', startUnit: 1, endUnit: 2 }),
      course({ courseName: 'B', startUnit: 2, endUnit: 3 }),
    ])).toHaveLength(1)
  })

  test('returns nothing for an empty day', () => {
    expect(groupConflictingCourses([])).toEqual([])
  })
})

describe('schedule week paging', () => {
  // 2026-09-16 是周三；周起始日为周日时，本周从 2026-09-13 开始。
  const now = new Date(2026, 8, 16)

  test('page 0 is the current week regardless of the current week number', () => {
    expect(weekStartForPage(now, 0, 3, 7)).toEqual(new Date(2026, 8, 13))
    expect(weekStartForPage(now, 0, 3, 1)).toEqual(new Date(2026, 8, 14))
  })

  test('other pages are offset from the current week', () => {
    expect(weekStartForPage(now, 4, 3, 7)).toEqual(new Date(2026, 8, 20))
    expect(weekStartForPage(now, 1, 3, 7)).toEqual(new Date(2026, 7, 30))
  })

  test('page 0 shows every course rather than the courses of week 0', () => {
    const all = [
      course({ courseName: 'A', startUnit: 1, endUnit: 2, weekIndexes: [1, 2] }),
      course({ courseName: 'B', startUnit: 3, endUnit: 4, weekIndexes: [5] }),
    ]

    // 曾经的 bug：直接拿 coursesForWeek(courses, 0) 取数，周次从 1 开始，
    // 「全部课表」永远是空的。
    expect(coursesForWeek(all, 0)).toEqual([])
    expect(coursesForPage(all, 0)).toHaveLength(2)
    expect(coursesForPage(all, 5).map((item) => item.courseName)).toEqual(['B'])
  })

  test('uses the period count the grid is built from', () => {
    expect(PERIOD_COUNT).toBe(12)
  })
})

describe('course card styles', () => {
  test('offers compact, standard and relaxed sizes', () => {
    expect(COURSE_CARD_STYLES.map((item) => item.size)).toEqual([50, 55, 60])
    expect(COURSE_CARD_STYLES.map((item) => item.labelKey)).toEqual(['compact', 'standard', 'relaxed'])
  })

  test('resolves a stored size back to its style, defaulting to standard', () => {
    expect(courseCardStyleForSize(50).value).toBe('small')
    expect(courseCardStyleForSize(60).value).toBe('large')
    expect(courseCardStyleForSize(999).value).toBe('normal')
  })

  test('font sizes grow with the style, matching Flutter deltas', () => {
    const small = courseCardFontSizes('small')
    const normal = courseCardFontSizes('normal')
    const large = courseCardFontSizes('large')

    expect(small.name).toBeCloseTo(10.4)
    expect(normal.name).toBeCloseTo(10.9)
    expect(large.name).toBeCloseTo(11.3)
    expect(small.room).toBeLessThan(normal.room)
    expect(normal.teacher).toBeLessThan(large.teacher)
  })
})
