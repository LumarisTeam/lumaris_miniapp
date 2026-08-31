import { Switch, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StateView } from '@/components/common/StateView'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import '@/styles/pages.scss'

export default function ScheduleSettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const session = useAuthStore((state) => state.session)
  const courses = useCourseStore((state) => state.courses)
  const ignored = useCourseStore((state) => state.ignoredCourseNames)
  const toggleIgnored = useCourseStore((state) => state.toggleIgnored)
  const refresh = useCourseStore((state) => state.refresh)
  const names = Array.from(new Set(courses.map((course) => course.name))).sort()

  return (
    <PageShell title='课表设置' showBack>
      <View className='page-section'>
        <ClubCard padding='none'>
          <ListRow title='显示课表网格' subtitle='在课表页按星期和节次排列课程' icon='category' trailing={<Switch checked={settings.showCourseGrid} color='#007aff' onChange={(event) => setSettings({ showCourseGrid: event.detail.value })} />} />
          <ListRow title='无剩余课程时显示明日' subtitle='首页今日课程结束后切换到明日课程' icon='calendar' trailing={<Switch checked={settings.showTomorrow} color='#007aff' onChange={(event) => setSettings({ showTomorrow: event.detail.value })} />} />
          <ListRow title='自定义课程' subtitle='手工新增、编辑或删除课程' icon='edit' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/custom-course/index' })} />
          <ListRow title='立即同步课表' subtitle={session ? '从教务系统获取最新数据' : '登录后可用'} icon='refresh' onClick={session ? () => void refresh(session.studentId).then(() => Taro.showToast({ title: '同步完成', icon: 'success' })) : undefined} />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>忽略课程</Text>
        <ClubCard padding='none'>
          {names.length === 0 ? <StateView state='empty' compact title='暂无可设置课程' /> : names.map((name) => <ListRow key={name} title={name} subtitle={ignored.includes(name) ? '已从课表隐藏' : '正常显示'} icon={ignored.includes(name) ? 'close' : 'check'} trailing={<Switch checked={!ignored.includes(name)} color='#007aff' onChange={() => toggleIgnored(name)} />} />)}
        </ClubCard>
      </View>
      <View className='page-section'><View className='page-note'>微信小程序首轮不提供网页 HTML 课表导入。游客可使用自定义课程功能维护本地课表。</View></View>
    </PageShell>
  )
}
