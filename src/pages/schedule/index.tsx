import { useMemo, useRef, useState } from 'react'
import { ScrollView, Text, View, type ITouchEvent } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Popup } from '@nutui/nutui-react-taro'
import { AppIcon } from '@/components/common/AppIcon'
import { ListRow } from '@/components/common/ListRow'
import { PageShell } from '@/components/common/PageShell'
import { StateView } from '@/components/common/StateView'
import { CourseDetailSheet } from '@/components/schedule/CourseDetailSheet'
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid'
import { WeekdayHeader } from '@/components/schedule/WeekdayHeader'
import { COURSE_CARD_STYLES, courseCardStyleForSize } from '@/components/schedule/ScheduleCourseCard'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useTranslation } from '@/i18n'
import { coursesForPage, weekStartForPage } from '@/utils/education'
import { CAOTANG_CAMPUS, resolveCampusName } from '@/utils/scheduleTime'
import type { Course } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

/** 横滑切周的触发距离（设备像素）与方向判定比例。 */
const SWIPE_MIN_DISTANCE = 60
const SWIPE_DIRECTION_RATIO = 1.5

/** 课表页：周次导航 + 星期栏 + 网格，支持横滑切周。 */
export default function SchedulePage() {
  const t = useTranslation()
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

  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const school = useAppStore((state) => state.school)
  const supportsTimetable = school.features.includes('timetable')

  const [detailCourse, setDetailCourse] = useState<Course | null>(null)
  const [conflicts, setConflicts] = useState<Course[] | null>(null)
  const [stylePickerVisible, setStylePickerVisible] = useState(false)
  const [weekMenuVisible, setWeekMenuVisible] = useState(false)

  useDidShow(() => {
    if (session && supportsTimetable && courses.length === 0) void refresh(session.educationId, 'local-first')
  })
  usePullDownRefresh(() => {
    if (!session || !supportsTimetable) {
      Taro.stopPullDownRefresh()
      return
    }
    void refresh(session.educationId).finally(() => Taro.stopPullDownRefresh())
  })

  const visibleCourses = useMemo(() => {
    const ignoredNames = new Set(ignored)
    return [...courses.filter((course) => !ignoredNames.has(course.courseName)), ...customCourses]
  }, [courses, customCourses, ignored])

  // 页号沿用课程约定：0 是全部课表，1..maxWeek 是第 N 周。
  const weekCourses = useMemo(
    () =>
      coursesForPage(visibleCourses, week).sort(
        (left, right) => left.weekday - right.weekday || left.startUnit - right.startUnit,
      ),
    [visibleCourses, week],
  )

  const campus = visibleCourses.length > 0 ? resolveCampusName(visibleCourses[0]) : CAOTANG_CAMPUS
  const cellHeight = settings.courseSize * 2
  const activeStyle = courseCardStyleForSize(settings.courseSize)
  const weekStartDate = weekStartForPage(new Date(), week, weekNow, school.weekStartDay)

  const weekSubtitle = weekNow <= 0 ? t('weeksUntilStart', { n: -weekNow + 1 }) : t('currentWeek', { n: weekNow })

  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = (event: ITouchEvent) => {
    const touch = event.touches[0]
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }
  const handleTouchEnd = (event: ITouchEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    const touch = event.changedTouches[0]
    if (!start || !touch) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    // 竖向位移明显更大时当成页面滚动，不切周。
    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE) return
    if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_DIRECTION_RATIO) return

    setWeek(deltaX < 0 ? week + 1 : week - 1)
  }

  if (!supportsTimetable) {
    return <PageShell title={t('schedule')}><StateView state='empty' title={t('schoolNotSupported')} /></PageShell>
  }

  const action = (
    <View className='icon-action pressable' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/schedule/index' })}>
      <AppIcon name='settings' size={21} />
    </View>
  )

  return (
    <PageShell title={t('schedule')} action={action} className='schedule-page'>
      <View className='schedule-topbar'>
        <View
          className='schedule-topbar__info pressable'
          onClick={() => setWeek(weekNow)}
          onLongClick={() => setWeekMenuVisible(true)}
        >
          <Text className='schedule-topbar__title'>
            {week <= 0 ? t('allSchedules') : t('weekUnit', { n: week })}
          </Text>
          <Text className='schedule-topbar__subtitle'>{weekSubtitle}</Text>
        </View>

        <View className='schedule-topbar__actions'>
          <View
            className={`icon-action pressable ${stylePickerVisible ? 'icon-action--active' : ''}`}
            onClick={() => setStylePickerVisible((value) => !value)}
          >
            <AppIcon name='category' size={20} />
          </View>
          <View className='icon-action pressable' onClick={() => void refresh(session?.educationId ?? '')}>
            <AppIcon name='refresh' size={20} />
          </View>
        </View>
      </View>

      {stylePickerVisible ? (
        <View className='schedule-style'>
          {COURSE_CARD_STYLES.map((item) => (
            <View
              className={`schedule-style__item pressable ${activeStyle.value === item.value ? 'schedule-style__item--active' : ''}`}
              key={item.value}
              onClick={() => setSettings({ courseSize: item.size })}
            >
              {t(item.labelKey)}
            </View>
          ))}
        </View>
      ) : null}

      {!session && visibleCourses.length === 0 ? (
        <StateView
          state='login'
          title={t('loginEduSystem')}
          description={t('customCourseManage')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      ) : (
        <>
          <View className='schedule-header'>
            {isStale ? <View className='page-note'>{t('refreshFailedFallback')}</View> : null}
            <WeekdayHeader
              weekStartDate={weekStartDate}
              showDate={week > 0}
              showGrid={settings.showCourseGrid}
              highlightToday={weekNow !== 0}
            />
          </View>

          <ScrollView
            scrollY
            enhanced
            showScrollbar={false}
            className='schedule-scroll'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* 空周也保留网格：节次、日期和时间轴本身就是信息，与 Flutter 一致。 */}
            <ScheduleGrid
              courses={weekCourses}
              cellHeight={cellHeight}
              weekStartDay={school.weekStartDay}
              campus={campus}
              cardStyle={activeStyle.value}
              showGrid={settings.showCourseGrid}
              onCourseTap={setDetailCourse}
              onConflictTap={setConflicts}
            />
          </ScrollView>
        </>
      )}

      <Popup visible={weekMenuVisible} position='bottom' round onClose={() => setWeekMenuVisible(false)}>
        <View className='schedule-menu'>
          <Text className='schedule-menu__title'>{t('schedule')}</Text>
          <ScrollView scrollY className='schedule-menu__list'>
            {Array.from({ length: maxWeek + 1 }, (_, index) => {
              const isCurrentWeek = index === weekNow && index > 0
              const label = index === 0 ? t('allSchedules') : t('weekUnit', { n: index })
              return (
                <ListRow
                  key={index}
                  title={`${label}${isCurrentWeek ? ` (${t('currentWeekLabel')})` : ''}`}
                  icon={index === week ? 'check' : undefined}
                  onClick={() => {
                    setWeek(index)
                    setWeekMenuVisible(false)
                  }}
                />
              )
            })}
          </ScrollView>
        </View>
      </Popup>

      <Popup visible={conflicts !== null} position='bottom' round onClose={() => setConflicts(null)}>
        <View className='schedule-menu'>
          <Text className='schedule-menu__title'>{t('courseConflict')}</Text>
          <ListRow
            title={t('cancel')}
            icon='close'
            onClick={() => setConflicts(null)}
          />
          {(conflicts ?? []).map((course) => (
            <ListRow
              key={course.id}
              title={course.courseName}
              subtitle={[course.room, course.teachers.join('、')].filter(Boolean).join(' · ')}
              iconColor={course.color}
              icon='calendar'
              onClick={() => {
                setConflicts(null)
                setDetailCourse(course)
              }}
            />
          ))}
        </View>
      </Popup>

      <CourseDetailSheet
        course={detailCourse}
        visible={detailCourse !== null}
        onClose={() => setDetailCourse(null)}
      />
    </PageShell>
  )
}
