import { useMemo } from 'react'
import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { AppIcon } from '@/components/common/AppIcon'
import { StateView } from '@/components/common/StateView'
import { CourseCard } from '@/components/course/CourseCard'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { coursesForWeek, getCourseTime, orderedWeekdays } from '@/utils/education'
import '@/styles/pages.scss'
import './index.scss'

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']

export default function SchedulePage() {
  const session = useAuthStore((state) => state.session)
  const courses = useCourseStore((state) => state.courses)
  const customCourses = useCourseStore((state) => state.customCourses)
  const ignored = useCourseStore((state) => state.ignoredCourseNames)
  const week = useCourseStore((state) => state.currentWeek)
  const weekNow = useCourseStore((state) => state.weekNow)
  const maxWeek = useCourseStore((state) => state.maxWeek)
  const setWeek = useCourseStore((state) => state.setCurrentWeek)
  const refresh = useCourseStore((state) => state.refresh)
  const isStale = useCourseStore((state) => state.isStale)
  const showCourseGrid = useAppStore((state) => state.settings.showCourseGrid)
  const weekStartDay = useAppStore((state) => state.school.weekStartDay)
  const supportsTimetable = useAppStore((state) => state.school.features.includes('timetable'))
  const weekdays = orderedWeekdays(weekStartDay)

  useDidShow(() => { if (session && supportsTimetable && courses.length === 0) void refresh(session.studentId, 'local-first') })
  usePullDownRefresh(() => {
    if (!session || !supportsTimetable) return Taro.stopPullDownRefresh()
    void refresh(session.studentId).finally(() => Taro.stopPullDownRefresh())
  })

  const visibleCourses = useMemo(() => {
    const ignoredNames = new Set(ignored)
    return [...courses.filter((course) => !ignoredNames.has(course.courseName)), ...customCourses]
  }, [courses, customCourses, ignored])
  const weekCourses = useMemo(
    () => coursesForWeek(visibleCourses, week).sort((left, right) => left.weekday - right.weekday || left.startUnit - right.startUnit),
    [visibleCourses, week],
  )

  const action = (
    <View className='icon-action pressable' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/schedule/index' })}>
      <AppIcon name='settings' size={21} />
    </View>
  )

  if (!supportsTimetable) {
    return <PageShell title='课表'><StateView state='empty' title='当前学校暂不支持课表' /></PageShell>
  }

  return (
    <PageShell title='课表' action={action}>
      <View className='schedule-weekbar'>
        <View className='schedule-weekbar__button pressable' onClick={() => setWeek(week - 1)}><AppIcon name='back' size={18} /></View>
        <View className='schedule-weekbar__center' onClick={() => setWeek(weekNow)}><Text className='schedule-weekbar__title'>{week === 0 ? '全部课程' : `第 ${week} 周`}</Text><Text className='schedule-weekbar__subtitle'>{maxWeek > 0 ? `共 ${maxWeek} 周 · 点击回到当前周` : '学期时间未同步'}</Text></View>
        <View className='schedule-weekbar__button pressable' onClick={() => setWeek(week + 1)}><AppIcon name='right' size={18} /></View>
      </View>

      {!session && visibleCourses.length === 0 ? (
        <StateView state='login' title='登录后自动同步课表' description='也可以在课表设置中手工添加课程' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} />
      ) : weekCourses.length === 0 ? (
        <StateView state='empty' title={`第 ${week} 周没有课程`} actionLabel='添加自定义课程' onAction={() => Taro.navigateTo({ url: '/subpackages/settings/custom-course/index' })} />
      ) : !showCourseGrid ? (
        <View className='schedule-list'>
          {isStale ? <View className='page-note'>刷新失败，当前显示本地课表缓存</View> : null}
          {weekdays.map((weekday) => {
            const day = DAY_NAMES[weekday - 1]
            const dayCourses = weekCourses.filter((course) => course.weekday === weekday)
            return dayCourses.length ? (
              <View key={day}>
                <Text className='schedule-list__day'>周{day}</Text>
                {dayCourses.map((course) => <CourseCard course={course} key={course.id} />)}
              </View>
            ) : null
          })}
        </View>
      ) : (
        <ScrollView scrollX className='schedule-scroll' enhanced showScrollbar={false}>
          <View className='schedule-grid'>
            <View className='schedule-grid__corner'>节次</View>
            {weekdays.map((weekday) => <View className='schedule-grid__day' key={weekday}>周{DAY_NAMES[weekday - 1]}</View>)}
            {Array.from({ length: 13 }, (_, index) => (
              <View className='schedule-grid__slot' style={{ gridColumn: 1, gridRow: index + 2 }} key={`slot-${index + 1}`}>
                <Text>{index + 1}</Text>
              </View>
            ))}
            {Array.from({ length: 91 }, (_, index) => (
              <View
                className='schedule-grid__cell'
                style={{ gridColumn: (index % 7) + 2, gridRow: Math.floor(index / 7) + 2 }}
                key={`cell-${index}`}
              />
            ))}
            {weekCourses.map((course) => {
              const time = getCourseTime(course)
              return (
                <View
                  className='schedule-grid__course pressable'
                  style={{
                    gridColumn: weekdays.indexOf(course.weekday) + 2,
                    gridRow: `${course.startUnit + 1} / span ${Math.max(1, course.endUnit - course.startUnit + 1)}`,
                    backgroundColor: course.color,
                  }}
                  key={course.id}
                  onClick={() => Taro.showModal({ title: course.courseName, content: `${course.room}\n${course.teachers.join('、')}\n${time.start}-${time.end}\n第 ${course.startUnit}-${course.endUnit} 节`, showCancel: false })}
                >
                  <Text className='schedule-grid__course-name'>{course.courseName}</Text>
                  <Text className='schedule-grid__course-meta'>{course.room}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </PageShell>
  )
}
