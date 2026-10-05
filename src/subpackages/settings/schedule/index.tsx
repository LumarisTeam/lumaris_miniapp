import { Switch, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { PageShell } from '@/components/common/PageShell'
import { StateView } from '@/components/common/StateView'
import { COURSE_CARD_STYLES } from '@/components/schedule/ScheduleCourseCard'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'

/**
 * 课表设置：课表管理、显示方式、忽略课程、同步。
 *
 * 对应 Flutter 的 `lib/ui/pages/schedule_list_page/schedule_setting_page.dart`。
 * 两处刻意未做：
 * - 日历订阅：订阅地址要把教务密码明文拼进 URL，而小程序明确不保存密码，
 *   复制一条含明文密码的链接与既有的隐私取舍冲突，需要单独确认。
 * - 课表背景：小程序临时文件路径会失效，要做得先落盘并处理清理，另开一项。
 */
export default function ScheduleSettingsPage() {
  const t = useTranslation()
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const session = useAuthStore((state) => state.session)
  const courses = useCourseStore((state) => state.courses)
  const ignored = useCourseStore((state) => state.ignoredCourseNames)
  const toggleIgnored = useCourseStore((state) => state.toggleIgnored)
  const refresh = useCourseStore((state) => state.refresh)

  const names = Array.from(new Set(courses.map((course) => course.courseName))).sort()

  const syncNow = () => {
    if (!session) return
    void refresh(session.educationId).then(() => Taro.showToast({ title: t('updateComplete'), icon: 'success' }))
  }

  return (
    <PageShell title={t('scheduleSettingsTitle')} showBack>
      <View className='page-section'>
        <Text className='form-label'>{t('scheduleManagement')}</Text>
        <ClubCard padding='none'>
          <ListRow
            title={t('customCourseManage')}
            icon='edit'
            onClick={() => Taro.navigateTo({ url: '/subpackages/settings/custom-course/index' })}
          />
          <ListRow
            title={t('showCourseGrid')}
            icon='category'
            trailing={
              <Switch
                checked={settings.showCourseGrid}
                color='#007aff'
                onChange={(event) => setSettings({ showCourseGrid: event.detail.value })}
              />
            }
          />
          <ListRow
            title={t('showTomorrowSchedule')}
            icon='calendar'
            trailing={
              <Switch
                checked={settings.showTomorrow}
                color='#007aff'
                onChange={(event) => setSettings({ showTomorrow: event.detail.value })}
              />
            }
          />
          <ListRow
            title={t('refreshSchedule')}
            subtitle={session ? undefined : t('loginEduSystem')}
            icon='refresh'
            onClick={session ? syncNow : undefined}
          />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('switchStyle')}</Text>
        <ClubCard>
          <View className='segmented'>
            {COURSE_CARD_STYLES.map((item) => (
              <View
                className={`segmented__item pressable ${settings.courseSize === item.size ? 'segmented__item--active' : ''}`}
                key={item.value}
                onClick={() => setSettings({ courseSize: item.size })}
              >
                {t(item.labelKey)}
              </View>
            ))}
          </View>
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('ignoreCourses')}</Text>
        <ClubCard padding='none'>
          {names.length === 0 ? (
            <StateView state='empty' compact title={t('empty')} />
          ) : (
            names.map((name) => (
              <ListRow
                key={name}
                title={name}
                icon={ignored.includes(name) ? 'close' : 'check'}
                trailing={
                  <Switch
                    checked={!ignored.includes(name)}
                    color='#007aff'
                    onChange={() => toggleIgnored(name)}
                  />
                }
              />
            ))
          )}
        </ClubCard>
      </View>
    </PageShell>
  )
}
