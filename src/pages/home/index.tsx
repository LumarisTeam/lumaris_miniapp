import { useMemo, useState } from 'react'
import { Switch, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Popup } from '@nutui/nutui-react-taro'
import { AppIcon } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { PageShell } from '@/components/common/PageShell'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StateView } from '@/components/common/StateView'
import { ExamCard } from '@/components/home/ExamCard'
import { HomeCourseCard } from '@/components/home/HomeCourseCard'
import { TilesWidget } from '@/components/home/TilesWidget'
import { CourseDetailSheet } from '@/components/schedule/CourseDetailSheet'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useExamStore } from '@/stores/exam'
import { useTranslation } from '@/i18n'
import { getHomeCourses } from '@/utils/education'
import type { Course } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

/** 首页：今日课表 + 快捷方式磁贴 + 近期考试，与 Flutter 的三段式一致。 */
export default function HomePage() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const school = useAppStore((state) => state.school)

  const courses = useCourseStore((state) => state.courses)
  const customCourses = useCourseStore((state) => state.customCourses)
  const ignoredNames = useCourseStore((state) => state.ignoredCourseNames)
  const timeInfo = useCourseStore((state) => state.timeInfo)
  const refreshCourses = useCourseStore((state) => state.refresh)
  const coursesLoading = useCourseStore((state) => state.loading)
  const loadExams = useExamStore((state) => state.load)

  const [detailCourse, setDetailCourse] = useState<Course | null>(null)
  const [scheduleSettingsVisible, setScheduleSettingsVisible] = useState(false)

  const sync = async () => {
    if (!session) return
    await Promise.allSettled([
      school.features.includes('timetable') ? refreshCourses(session.educationId) : Promise.resolve(),
      school.features.includes('exam_schedule') ? loadExams('refresh') : Promise.resolve(),
    ])
  }

  useDidShow(() => { void sync() })
  usePullDownRefresh(() => { void sync().finally(() => Taro.stopPullDownRefresh()) })

  const now = new Date()
  const visibleCourses = useMemo(() => {
    const ignored = new Set(ignoredNames)
    return [...courses.filter((course) => !ignored.has(course.courseName)), ...customCourses]
  }, [courses, customCourses, ignoredNames])
  const homeSchedule = getHomeCourses(visibleCourses, timeInfo, school.weekStartDay, settings.showTomorrow, now)
  const todayCourses = homeSchedule.courses

  return (
    <PageShell title={t('appName')}>
      <View className='page-section'>
        <SectionHeader
          title={homeSchedule.isTomorrow ? t('tomorrowSchedule') : t('todayScheduleLabel')}
          trailing={
            <View className='home-schedule-actions'>
              <Text className='section-header__trailing'>{`${now.getMonth() + 1}月${now.getDate()}日`}</Text>
              <View className='icon-action pressable' onClick={() => setScheduleSettingsVisible(true)}>
                <AppIcon name='settings' size={20} />
              </View>
            </View>
          }
        />

        {!session ? (
          <ClubCard>
            <StateView
              state='login'
              compact
              title={t('loginEduSystem')}
              actionLabel={t('goToLogin')}
              onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
            />
          </ClubCard>
        ) : coursesLoading && visibleCourses.length === 0 ? (
          <ClubCard>
            <StateView state='loading' compact title={t('loadingSchedule')} description={t('loadingScheduleSubtitle')} />
          </ClubCard>
        ) : todayCourses.length === 0 ? (
          <ClubCard>
            <StateView state='empty' compact title={t('noCourseToday')} description={t('noCourseTodaySubtitle')} />
          </ClubCard>
        ) : (
          <View className='stack'>
            {todayCourses.map((course) => (
              <HomeCourseCard course={course} key={course.id} onTap={() => setDetailCourse(course)} />
            ))}
          </View>
        )}
      </View>

      {session ? (
        <View className='page-section'>
          <TilesWidget />
        </View>
      ) : null}

      {session && school.features.includes('exam_schedule') ? (
        <View className='page-section'>
          <ExamCard />
        </View>
      ) : null}

      <Popup
        visible={scheduleSettingsVisible}
        position='bottom'
        round
        onClose={() => setScheduleSettingsVisible(false)}
      >
        <View className='home-settings-sheet'>
          <Text className='home-settings-sheet__title'>{t('settings')}</Text>
          <View className='home-settings-sheet__row'>
            <Text className='home-settings-sheet__label'>{t('showTomorrowSchedule')}</Text>
            <Switch
              checked={settings.showTomorrow}
              color='#007aff'
              onChange={(event) => setSettings({ showTomorrow: event.detail.value })}
            />
          </View>
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
