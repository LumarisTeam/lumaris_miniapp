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
import { calculateCurrentWeek, coursesForWeek, getCourseTime } from '@/utils/education'
import '@/styles/pages.scss'
import './index.scss'

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']

export default function SchedulePage() {
  const session = useAuthStore((state) => state.session)
  const courses = useCourseStore((state) => state.courses)
  const customCourses = useCourseStore((state) => state.customCourses)
  const ignored = useCourseStore((state) => state.ignoredCourseNames)
  const week = useCourseStore((state) => state.currentWeek)
  const timeInfo = useCourseStore((state) => state.timeInfo)
  const setWeek = useCourseStore((state) => state.setCurrentWeek)
  const refresh = useCourseStore((state) => state.refresh)
  const showCourseGrid = useAppStore((state) => state.settings.showCourseGrid)

  useDidShow(() => { if (session && courses.length === 0) void refresh(session.studentId) })
  usePullDownRefresh(() => {
    if (!session) return Taro.stopPullDownRefresh()
    void refresh(session.studentId).finally(() => Taro.stopPullDownRefresh())
  })

  const visibleCourses = useMemo(() => {
    const ignoredNames = new Set(ignored)
    return [...courses.filter((course) => !ignoredNames.has(course.name)), ...customCourses]
  }, [courses, customCourses, ignored])
  const weekCourses = useMemo(
    () => coursesForWeek(visibleCourses, week).sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startSlot - right.startSlot),
    [visibleCourses, week],
  )

  const action = (
    <View className='icon-action pressable' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/schedule/index' })}>
      <AppIcon name='settings' size={21} />
    </View>
  )

  return (
    <PageShell title='课表' action={action}>
      <View className='schedule-weekbar'>
        <View className='schedule-weekbar__button pressable' onClick={() => setWeek(week - 1)}><AppIcon name='back' size={18} /></View>
        <View className='schedule-weekbar__center' onClick={() => setWeek(calculateCurrentWeek(timeInfo))}><Text className='schedule-weekbar__title'>第 {week} 周</Text><Text className='schedule-weekbar__subtitle'>点击回到当前周</Text></View>
        <View className='schedule-weekbar__button pressable' onClick={() => setWeek(week + 1)}><AppIcon name='right' size={18} /></View>
      </View>

      {!session && visibleCourses.length === 0 ? (
        <StateView state='login' title='登录后自动同步课表' description='也可以在课表设置中手工添加课程' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} />
      ) : weekCourses.length === 0 ? (
        <StateView state='empty' title={`第 ${week} 周没有课程`} actionLabel='添加自定义课程' onAction={() => Taro.navigateTo({ url: '/subpackages/settings/custom-course/index' })} />
      ) : !showCourseGrid ? (
        <View className='schedule-list'>
          {DAY_NAMES.map((day, index) => {
            const dayCourses = weekCourses.filter((course) => course.dayOfWeek === index + 1)
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
            {DAY_NAMES.map((day) => <View className='schedule-grid__day' key={day}>周{day}</View>)}
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
                    gridColumn: course.dayOfWeek + 1,
                    gridRow: `${course.startSlot + 1} / span ${Math.max(1, course.endSlot - course.startSlot + 1)}`,
                    backgroundColor: course.color,
                  }}
                  key={course.id}
                  onClick={() => Taro.showModal({ title: course.name, content: `${course.location}\n${course.teacher}\n${time.start}-${time.end}\n第 ${course.startSlot}-${course.endSlot} 节`, showCancel: false })}
                >
                  <Text className='schedule-grid__course-name'>{course.name}</Text>
                  <Text className='schedule-grid__course-meta'>{course.location}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </PageShell>
  )
}
