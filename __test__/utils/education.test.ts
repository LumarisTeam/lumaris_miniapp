import {
  calculateCurrentWeek,
  calculateScoreSummary,
  assignCourseColors,
  coursesForDay,
  getCourseTime,
  normalizeBusTrip,
  normalizeCourse,
  normalizePayment,
  normalizeScore,
  normalizeTimeInfo,
} from '@/utils/education'

describe('education domain helpers', () => {
  test('normalizes API course aliases and clamps values', () => {
    const course = normalizeCourse({
      courseName: '高等数学',
      teachers: ['张老师'],
      room: '教学楼 101',
      weekIndexes: ['1', 2, 0, 31],
      weekday: 9,
      startUnit: 3,
      endUnit: 4,
    })

    expect(course).toMatchObject({
      name: '高等数学',
      teacher: '张老师',
      location: '教学楼 101',
      weeks: [1, 2],
      dayOfWeek: 7,
      startSlot: 3,
      endSlot: 4,
    })
  })

  test('calculates current week from semester start', () => {
    const info = normalizeTimeInfo({ startDate: '2026-08-31', semester: '2026-2027-1' })
    expect(calculateCurrentWeek(info, new Date('2026-09-14T08:00:00'))).toBe(3)
  })

  test('filters and sorts courses for a selected day', () => {
    const courses = [
      normalizeCourse({ name: '晚课', weeks: [2], dayOfWeek: 1, startSlot: 8, endSlot: 9 }),
      normalizeCourse({ name: '早课', weeks: [2], dayOfWeek: 1, startSlot: 1, endSlot: 2 }),
      normalizeCourse({ name: '其他天', weeks: [2], dayOfWeek: 2, startSlot: 1, endSlot: 2 }),
    ]
    expect(coursesForDay(courses, 2, 1).map((course) => course.name)).toEqual(['早课', '晚课'])
  })

  test('respects selected weeks for custom courses and treats empty weeks as always active', () => {
    const custom = normalizeCourse({ name: '自定义课程', weeks: [2], isCustom: true })
    const always = normalizeCourse({ name: '无周次课程', weeks: [] })
    expect(coursesForDay([custom, always], 1, 1).map((course) => course.name)).toEqual(['无周次课程'])
    expect(coursesForDay([custom, always], 2, 1).map((course) => course.name)).toEqual(['自定义课程', '无周次课程'])
  })

  test('assigns one stable color to courses with the same name', () => {
    const courses = assignCourseColors([
      normalizeCourse({ name: '大学英语', color: '#123456' }),
      normalizeCourse({ name: '大学英语' }),
      normalizeCourse({ name: '高等数学' }),
    ])
    expect(courses[0].color).toBe('#123456')
    expect(courses[1].color).toBe('#123456')
    expect(courses[2].color).not.toBe('#123456')
  })

  test('uses campus-specific course times', () => {
    const caotang = normalizeCourse({ name: '课程', campus: '草堂校区', startSlot: 1, endSlot: 2 })
    expect(getCourseTime(caotang, new Date('2026-01-01'))).toEqual({ start: '08:30', end: '10:05' })
  })

  test('calculates weighted GPA, credits and numeric average', () => {
    const scores = [
      normalizeScore({ lessonName: 'A', grade: '90', gpa: 4, credit: 2 }),
      normalizeScore({ lessonName: 'B', grade: '80', gpa: 3, credit: 1 }),
    ]
    expect(calculateScoreSummary(scores)).toEqual({ credits: 3, weightedGpa: 11 / 3, average: 85 })
  })

  test('normalizes bus and payment variants', () => {
    expect(normalizeBusTrip({ runTime: '08:00:00', from: '雁塔', to: '草堂' })).toMatchObject({ departureTime: '08:00', departureStation: '雁塔', arrivalStation: '草堂' })
    expect(normalizePayment({ datetimeStr: '2026-08-31', resume: '食堂', tranamt: '-12.5' })).toMatchObject({ description: '食堂', amount: -12.5 })
  })
})
