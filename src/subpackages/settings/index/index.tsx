import { useMemo, useRef, useState } from 'react'
import { Image, Picker, Switch, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { LanguageSetting } from '@/components/common/LanguageSetting'
import { ListRow } from '@/components/common/ListRow'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useScoreStore } from '@/stores/score'
import { useStudyProgressStore } from '@/stores/studyProgress'
import { refreshAll } from '@/services/refreshService'
import { useTranslation, type MessageKey } from '@/i18n'
import type { StartPage, ThemeMode } from '@/types/domain'
import { ICP_NUMBER, haptic, openExternalUrl } from '@/utils/platform'
import { clearEducationCache } from '@/utils/storage'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 设置与关于。
 *
 * 对应 Flutter 的 `lib/ui/pages/setting_page/setting_page.dart`：应用头图 + 基本设置 /
 * 版本 / 关于 / 其他四段，退出登录和清除缓存都在「其他」里。
 *
 * 首页服务开关已经删掉——首页显示哪些磁贴由首页磁贴编辑管理（见 `@/stores/tile`）。
 */

const THEME_KEYS: Array<{ value: ThemeMode; labelKey: MessageKey }> = [
  { value: 'system', labelKey: 'followSystem' },
  { value: 'light', labelKey: 'light' },
  { value: 'dark', labelKey: 'dark' },
]

const START_PAGE_KEYS: Array<{ value: StartPage; labelKey: MessageKey }> = [
  { value: 'home', labelKey: 'home' },
  { value: 'schedule', labelKey: 'schedule' },
  { value: 'score', labelKey: 'score' },
  { value: 'profile', labelKey: 'profile' },
]

/** 连点版本号多少次进彩蛋，与 Flutter `_handleTap` 一致。 */
const EGG_TAP_TARGET = 5
/** 两次点击间隔超过这个时间就重新计数。 */
const EGG_TAP_WINDOW = 1000

function appVersion(): string {
  try {
    return Taro.getAccountInfoSync?.()?.miniProgram?.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

export default function SettingsPage() {
  const t = useTranslation()
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const clearCourses = useCourseStore((state) => state.clearRemote)
  const clearScores = useScoreStore((state) => state.clear)
  const clearProgress = useStudyProgressStore((state) => state.clear)

  const [refreshing, setRefreshing] = useState(false)
  const tapping = useRef<{ count: number; last: number }>({ count: 0, last: 0 })
  const version = useMemo(appVersion, [])

  const themeLabel = t(THEME_KEYS.find((item) => item.value === settings.theme)?.labelKey ?? 'followSystem')
  const startPageIndex = Math.max(0, START_PAGE_KEYS.findIndex((item) => item.value === settings.startPage))

  const pickTheme = () => {
    void Taro.showActionSheet({ itemList: THEME_KEYS.map((item) => t(item.labelKey)) })
      .then(({ tapIndex }) => {
        const next = THEME_KEYS[tapIndex]
        if (next) setSettings({ theme: next.value })
      })
      .catch(() => { /* 用户取消 */ })
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    Taro.showLoading({ title: t('refreshingData'), mask: true })
    const outcome = await refreshAll()
    Taro.hideLoading()
    setRefreshing(false)
    Taro.showToast({
      title: outcome.success ? t('refreshDataSuccess') : t('refreshDataFailed'),
      icon: outcome.success ? 'success' : 'none',
    })
  }

  const handleVersionTap = () => {
    const now = Date.now()
    const state = tapping.current
    state.count = now - state.last > EGG_TAP_WINDOW ? 1 : state.count + 1
    state.last = now
    if (state.count >= EGG_TAP_TARGET) {
      state.count = 0
      void Taro.navigateTo({ url: '/subpackages/content/egg/index' })
    }
  }

  const clearCache = () => {
    Taro.showModal({
      title: t('confirmClearCacheTitle'),
      content: t('confirmClearCacheContent'),
      confirmText: t('clearCache'),
      confirmColor: '#ff3b30',
      success: ({ confirm }) => {
        if (!confirm) return
        clearEducationCache()
        clearCourses()
        clearScores()
        clearProgress()
        Taro.showToast({ title: t('cacheCleared'), icon: 'success' })
      },
    })
  }

  const confirmLogout = () => {
    Taro.showModal({
      title: t('confirmLogoutTitle'),
      content: t('confirmLogoutContent'),
      confirmText: t('logout'),
      confirmColor: '#ff3b30',
      success: ({ confirm }) => {
        if (!confirm) return
        logout()
        Taro.switchTab({ url: '/pages/profile/index' })
      },
    })
  }

  return (
    <PageShell title={t('settingsAbout')} showBack>
      <View className='settings-header'>
        <Image className='settings-header__logo' src={logo} mode='aspectFit' />
        <Text className='settings-header__name'>{t('appName')}</Text>
        <Text className='settings-header__slogan'>{t('appSlogan')}</Text>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('basicSettings')}</Text>
        <ClubCard padding='none'>
          <ListRow title={t('refreshData')} icon='refresh' onClick={() => void handleRefresh()} />
          <ListRow title={t('appearance')} subtitle={themeLabel} icon='notice' onClick={pickTheme} />
          <LanguageSetting />
          <ListRow
            title={t('showTomorrowCourses')}
            subtitle={t('showTomorrowCoursesSubtitle')}
            icon='clock'
            trailing={
              <Switch
                checked={settings.showTomorrow}
                color='#007aff'
                onChange={(event) => setSettings({ showTomorrow: event.detail.value })}
              />
            }
          />
          <ListRow
            title={t('hapticFeedback')}
            subtitle={t('hapticFeedbackSubtitle')}
            icon='alarm'
            trailing={
              <Switch
                checked={settings.hapticFeedback}
                color='#007aff'
                onChange={(event) => {
                  setSettings({ hapticFeedback: event.detail.value })
                  if (event.detail.value) haptic()
                }}
              />
            }
          />
          <Picker
            mode='selector'
            value={startPageIndex}
            range={START_PAGE_KEYS.map((item) => t(item.labelKey))}
            onChange={(event) => setSettings({ startPage: START_PAGE_KEYS[Number(event.detail.value)]?.value ?? 'home' })}
          >
            <View>
              <ListRow title={t('firstPageOnLaunch')} icon='home' value={t(START_PAGE_KEYS[startPageIndex].labelKey)} />
            </View>
          </Picker>
          <ListRow title={t('schedule')} subtitle={t('scheduleSettingsSubtitle')} icon='calendar' onClick={() => Taro.navigateTo({ url: '/subpackages/settings/schedule/index' })} />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('version')}</Text>
        <ClubCard padding='none'>
          <ListRow title={t('version')} subtitle={version} icon='check' onClick={handleVersionTap} />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('about')}</Text>
        <ClubCard padding='none'>
          <ListRow title={t('feedback')} subtitle={t('feedbackSubtitle')} icon='tips' onClick={() => Taro.navigateTo({ url: '/subpackages/content/feedback/index' })} />
          <ListRow title={t('team')} subtitle={t('teamName')} icon='people' onClick={() => Taro.navigateTo({ url: '/subpackages/content/author/index' })} />
          <ListRow title={t('openSourceLicense')} subtitle={t('mitLicense')} icon='book' onClick={() => Taro.navigateTo({ url: '/subpackages/content/license/index' })} />
          <ListRow title={t('privacyPolicy')} subtitle={t('privacyPolicySubtitle')} icon='notice' onClick={() => Taro.navigateTo({ url: '/subpackages/content/privacy/index' })} />
          <ListRow title={t('userAgreement')} subtitle={t('userAgreementSubtitle')} icon='book' onClick={() => Taro.navigateTo({ url: '/subpackages/content/agreement/index' })} />
          <ListRow title={t('icp')} subtitle={ICP_NUMBER} icon='check' onClick={() => void openExternalUrl('https://beian.miit.gov.cn/')} />
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('other')}</Text>
        <ClubCard padding='none'>
          <ListRow
            title={t('showCourseGrid')}
            icon='calendar'
            trailing={
              <Switch
                checked={settings.showCourseGrid}
                color='#007aff'
                onChange={(event) => setSettings({ showCourseGrid: event.detail.value })}
              />
            }
          />
          <ListRow title={t('help')} icon='tips' onClick={() => Taro.navigateTo({ url: '/subpackages/content/help/index' })} />
          <ListRow title={t('clearCache')} icon='delete' danger onClick={clearCache} />
          {session ? <ListRow title={t('logoutEduSystem')} subtitle={t('logoutHint')} icon='user' danger onClick={confirmLogout} /> : null}
        </ClubCard>
      </View>
    </PageShell>
  )
}
