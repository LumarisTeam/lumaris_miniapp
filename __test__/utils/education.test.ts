import {
  calculateCurrentWeek,
  calculateWeekInfo,
  calculateScoreSummary,
  assignCourseColors,
  coursesForDay,
  colorForName,
  getCourseTime,
  normalizeBusTrip,
  normalizeCourse,
  normalizePayment,
  normalizeScore,
  normalizeTimeInfo,
  isUpcomingExam,
  getHomeCourses,
  orderedWeekdays,
  formatWeekRanges,
  academicYearKey,
  buildSemesterLabels,
  filterUpcomingBusTrips,
  summarizeElectricity,
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
      courseName: '高等数学',
      teachers: ['张老师'],
      room: '教学楼 101',
      weekIndexes: [1, 2],
      weekday: 7,
      startUnit: 3,
      endUnit: 4,
    })
  })

  test('calculates current week from semester start', () => {
    const info = normalizeTimeInfo({ startDate: '2026-08-31', endDate: '2027-01-17', semester: '2026-2027-1' })
    expect(calculateCurrentWeek(info, new Date('2026-09-14T08:00:00'), 1)).toBe(3)
    expect(calculateWeekInfo(info, new Date('2026-09-14T08:00:00'), 1)).toEqual({ week: 3, maxWeek: 20 })
  })

  test('matches Flutter week boundaries for Sunday and Monday starts', () => {
    const mondaySemester = normalizeTimeInfo({ startTime: '2024-03-04', endTime: '2024-06-30' })
    expect(calculateCurrentWeek(mondaySemester, new Date('2024-03-03T12:00:00'), 7)).toBe(1)
    expect(calculateCurrentWeek(mondaySemester, new Date('2024-03-09T12:00:00'), 7)).toBe(1)
    expect(calculateCurrentWeek(mondaySemester, new Date('2024-03-10T12:00:00'), 7)).toBe(2)
    expect(calculateCurrentWeek(mondaySemester, new Date('2024-03-10T12:00:00'), 1)).toBe(1)
    expect(calculateCurrentWeek(mondaySemester, new Date('2024-03-11T12:00:00'), 1)).toBe(2)

    const sundaySemester = normalizeTimeInfo({ startTime: '2024-03-10', endTime: '2024-06-30' })
    expect(calculateCurrentWeek(sundaySemester, new Date('2024-03-08T12:00:00'), 7)).toBe(0)
    expect(orderedWeekdays(7)).toEqual([7, 1, 2, 3, 4, 5, 6])
    expect(orderedWeekdays(1)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test('uses the next semester week when tomorrow crosses the school week boundary', () => {
    const info = normalizeTimeInfo({ startTime: '2024-03-04', endTime: '2024-06-30' })
    const sundayCourse = normalizeCourse({ courseName: '周日课程', weekIndexes: [2], weekday: 7, startUnit: 1, endUnit: 2 })
    const result = getHomeCourses([sundayCourse], info, 7, true, new Date('2024-03-09T22:00:00'))
    expect(result.isTomorrow).toBe(true)
    expect(result.courses.map((course) => course.courseName)).toEqual(['周日课程'])
  })

  test('filters and sorts courses for a selected day', () => {
    const courses = [
      normalizeCourse({ name: '晚课', weeks: [2], dayOfWeek: 1, startSlot: 8, endSlot: 9 }),
      normalizeCourse({ name: '早课', weeks: [2], dayOfWeek: 1, startSlot: 1, endSlot: 2 }),
      normalizeCourse({ name: '其他天', weeks: [2], dayOfWeek: 2, startSlot: 1, endSlot: 2 }),
    ]
    expect(coursesForDay(courses, 2, 1).map((course) => course.courseName)).toEqual(['早课', '晚课'])
  })

  test('respects selected weeks and excludes courses without week indexes like Flutter', () => {
    const custom = normalizeCourse({ name: '自定义课程', weeks: [2], isCustom: true })
    const always = normalizeCourse({ name: '无周次课程', weeks: [] })
    expect(coursesForDay([custom, always], 1, 1)).toEqual([])
    expect(coursesForDay([custom, always], 2, 1).map((course) => course.courseName)).toEqual(['自定义课程'])
  })

  test('formats week ranges exactly like Flutter CourseModel', () => {
    expect(formatWeekRanges([1, 2, 3, 5, 6, 9])).toBe('1-3,5-6,9')
    expect(formatWeekRanges([])).toBe('')
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
    expect(getCourseTime(caotang, new Date('2026-01-01'))).toEqual({ start: '8:30', end: '10:05' })
  })

  test('derives a stable color from a name regardless of order', () => {
    expect(colorForName('高等数学')).toBe(colorForName('高等数学'))
    expect(colorForName('高等数学')).not.toBe(colorForName('大学物理'))
    expect(colorForName('高等数学')).toMatch(/^#[0-9a-f]{6}$/)
    expect(colorForName('')).toMatch(/^#[0-9a-f]{6}$/)
  })

  test('calculates weighted GPA, credits and numeric average', () => {
    const scores = [
      normalizeScore({ lessonName: 'A', grade: '90', gpa: 4, credit: 2 }),
      normalizeScore({ lessonName: 'B', grade: '80', gpa: 3, credit: 1 }),
    ]
    expect(calculateScoreSummary(scores)).toEqual({ credits: 3, weightedGpa: 11 / 3, courses: 2 })
  })

  test('matches Flutter score rules for retakes, minor courses and valid credits', () => {
    const scores = [
      normalizeScore({ name: '重修前', lessonCode: 'A', gpa: '2', credit: '2' }),
      normalizeScore({ name: '重修后', lessonCode: 'A', gpa: '4', credit: '2' }),
      normalizeScore({ name: '辅修', lessonCode: 'M', gpa: '5', credit: '1', isMinor: true }),
      normalizeScore({ name: '无效', lessonCode: 'Z', gpa: '0', credit: '1' }),
    ]
    expect(calculateScoreSummary(scores)).toEqual({ credits: 5, weightedGpa: 25 / 9, courses: 3 })
  })

  test('builds Flutter score selector labels from the semester count', () => {
    // 文案由调用方提供，这里用一个中文替身；实际页面传的是 i18n 的 t()。
    const zh: Record<string, string> = {
      year1: '大一', year2: '大二', year3: '大三', year4: '大四',
      semesterSpringShort: '下', semesterAutumnShort: '上',
    }
    const translate = (key: string) => zh[key] ?? key

    expect(buildSemesterLabels(8, translate)).toEqual(['大四下', '大四上', '大三下', '大三上', '大二下', '大二上', '大一下', '大一上'])
    expect(buildSemesterLabels(1, translate)).toEqual(['大一上'])
  })

  test('maps academic year indexes to translation keys and clamps overflow', () => {
    expect(academicYearKey(0)).toBe('year1')
    expect(academicYearKey(3)).toBe('year4')
    expect(academicYearKey(-1)).toBe('year1')
    expect(academicYearKey(99)).toBe('year10')
  })

  test('normalizes bus and payment variants', () => {
    expect(normalizeBusTrip({ lineName: '1号线', runTime: '08:00:00', arrivalStationTime: 'T01:30', from: '雁塔', to: '草堂' })).toMatchObject({ lineName: '1号线', departureTime: '08:00', departureStation: '雁塔', arrivalStation: '草堂', arrivalTime: '9:30' })
    expect(normalizePayment({ datetimeStr: '2026-08-31', resume: '食堂', tranamt: '-12.5' })).toMatchObject({ description: '食堂', amount: -12.5 })
  })

  test('filters departed buses only for today like Flutter BusService', () => {
    const past = normalizeBusTrip({ runTime: '08:00:00', departureStation: '雁塔', arrivalStation: '草堂' })
    const future = normalizeBusTrip({ runTime: '10:00:00', departureStation: '雁塔', arrivalStation: '草堂' })
    expect(filterUpcomingBusTrips([past, future], '2026-09-01', new Date('2026-09-01T09:00:00')).map((trip) => trip.departureTime)).toEqual(['10:00'])
    expect(filterUpcomingBusTrips([past], '2026-09-02', new Date('2026-09-01T09:00:00'))).toEqual([past])
  })

  test('matches Flutter electricity total, today, daily average and peak calculations', () => {
    const summary = summarizeElectricity([
      { timestamp: '2026-08-31T08:00:00', value: 2 },
      { timestamp: '2026-09-01T08:00:00', value: 3 },
      { timestamp: '2026-09-01T09:00:00', value: 5 },
    ], new Date('2026-09-01T12:00:00'))
    expect(summary).toMatchObject({ total: 10, today: 8, averageDaily: 5, peak: { value: 5 } })
  })

  test('filters exams by parsed end time like Flutter ExamService', () => {
    expect(isUpcomingExam({ id: '1', name: '已结束', time: '2026-08-30 08:00-10:00', location: '', seat: '' }, new Date('2026-08-31T00:00:00'))).toBe(false)
    expect(isUpcomingExam({ id: '2', name: '待考试', time: '2026-09-02 08:00-10:00', location: '', seat: '' }, new Date('2026-08-31T00:00:00'))).toBe(true)
    expect(isUpcomingExam({ id: '3', name: '无效时间', time: '待定', location: '', seat: '' }, new Date('2026-08-31T00:00:00'))).toBe(false)
  })
})
