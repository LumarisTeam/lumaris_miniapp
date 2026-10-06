import { useEffect } from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import { StudyCreditCard } from '@/components/profile/StudyCreditCard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useStudyProgressStore } from '@/stores/studyProgress'
import { useTranslation, type MessageKey } from '@/i18n'
import type { Feature } from '@/types/domain'
import { colorForName } from '@/utils/education'
import { describeError } from '@/utils/errorText'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 我的。
 *
 * 对应 Flutter 的 `lib/ui/pages/profile_page/profile_page.dart`：顶部头像 + 账号，
 * 下面是一张图标网格卡片（登录态与学校功能开关决定有哪些条目），再下面是学业
 * 进度卡片。退出登录不在这里，和 Flutter 一样放在设置页。
 */

interface ProfileEntry {
  titleKey: MessageKey
  icon: IconName
  route: string
  /** 需要登录才显示，对应 Flutter 里 `if (isLogin)` 的那些条目。 */
  requiresLogin?: boolean
  /** 学校未开通该功能时隐藏。 */
  feature?: Feature
}

/** 顺序与 Flutter `getProfileButtonItems` 一致，未登录那条互斥地站在同一位置。 */
const ENTRIES: ProfileEntry[] = [
  { titleKey: 'campusNavigation', icon: 'link', route: '/subpackages/services/links/index', requiresLogin: true },
  { titleKey: 'settingsAbout', icon: 'settings', route: '/subpackages/settings/index/index' },
  { titleKey: 'schoolBus', icon: 'service', route: '/subpackages/services/bus/index', requiresLogin: true, feature: 'bus_schedule' },
  { titleKey: 'electricity', icon: 'notice', route: '/subpackages/services/electricity/index', requiresLogin: true, feature: 'electricity' },
  { titleKey: 'programLabel', icon: 'book', route: '/subpackages/services/program/index', requiresLogin: true, feature: 'program' },
  { titleKey: 'payment', icon: 'card', route: '/subpackages/services/payment/index', requiresLogin: true, feature: 'payment' },
  { titleKey: 'loginEduSystem', icon: 'user', route: '/pages/login/index' },
  { titleKey: 'campusMap', icon: 'location', route: '/subpackages/services/map/index', requiresLogin: true, feature: 'map' },
  { titleKey: 'help', icon: 'tips', route: '/subpackages/content/help/index' },
]

export default function ProfilePage() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const school = useAppStore((state) => state.school)

  const modules = useStudyProgressStore((state) => state.modules)
  const loading = useStudyProgressStore((state) => state.loading)
  const error = useStudyProgressStore((state) => state.error)
  const loadProgress = useStudyProgressStore((state) => state.load)
  const username = session?.username

  const canShowProgress = Boolean(username) && school.features.includes('study_progress')

  useEffect(() => {
    if (username && canShowProgress) void loadProgress(username)
  }, [username, canShowProgress, school.code, loadProgress])

  const entries = ENTRIES.filter((entry) => {
    if (entry.requiresLogin && !session) return false
    // 「登录教务系统」只在游客态出现，和 Flutter 的 if (!isLogin) 对应。
    if (entry.titleKey === 'loginEduSystem' && session) return false
    if (entry.feature && !school.features.includes(entry.feature)) return false
    return true
  })

  return (
    <PageShell title={t('profile')}>
      <View className='profile-header'>
        <Image className='profile-header__avatar' src={logo} mode='aspectFit' />
        <View className='grow'>
          <Text className='profile-header__name'>{username || t('notLoggedIn')}</Text>
          <Text className='profile-header__meta'>
            {session ? `${school.name} ${t('academicAccount')}` : t('guest')}
          </Text>
        </View>
        {!session ? (
          <View className='profile-header__login pressable' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            {t('loginEduSystem')}
          </View>
        ) : null}
      </View>

      <View className='page-section'>
        <ClubCard radius='panel'>
          <View className='profile-grid'>
            {entries.map((entry) => {
              const label = t(entry.titleKey)
              const color = colorForName(entry.titleKey)
              return (
                <View
                  className='profile-grid__cell pressable'
                  key={entry.route}
                  onClick={() => Taro.navigateTo({ url: entry.route })}
                >
                  <View className='profile-grid__icon' style={{ background: `${color}26` }}>
                    <AppIcon name={entry.icon} size={30} color={color} />
                  </View>
                  <Text className='profile-grid__label'>{label}</Text>
                </View>
              )
            })}
          </View>
        </ClubCard>
      </View>

      {session && canShowProgress ? (
        <View className='page-section'>
          {loading && modules.length === 0 ? (
            <StateView state='loading' compact title={t('syncingAcademic')} description={t('syncingAcademicSubtitle')} />
          ) : error && modules.length === 0 ? (
            <StateView state='error' compact title={t('loadFailed')} description={describeError(error, t)} />
          ) : (
            modules.map((module) => <StudyCreditCard key={module.type} data={module} />)
          )}
        </View>
      ) : null}

      {!session ? (
        <View className='page-section'>
          <StateView
            state='login'
            compact
            title={t('guestMode')}
            description={t('guestCourseHint')}
            actionLabel={t('loginEduSystem')}
            onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
          />
        </View>
      ) : null}
    </PageShell>
  )
}
