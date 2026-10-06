import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { FeatureGuard } from '@/components/common/FeatureGuard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getProgramSnapshot } from '@/services/domainRepository'
import type { PlanCourse } from '@/types/domain'
import { colorForName } from '@/utils/education'
import { describeError } from '@/utils/errorText'
import { groupProgramTerms, programTermLabel } from '@/utils/program'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 培养方案。
 *
 * 对应 Flutter 的 `lib/ui/pages/program_page/program_page.dart`：按学期分页，
 * 每门课显示类别色点、课程名、课程类别与学分。学期标签与分组的规则见
 * `@/utils/program`。
 */

export function ProgramContent() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const schoolCode = useAppStore((state) => state.school.code)
  const [courses, setCourses] = useState<PlanCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStale, setIsStale] = useState(false)
  const [activeTerm, setActiveTerm] = useState('')

  const load = useCallback(async (force = false) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const snapshot = await getProgramSnapshot(session.educationId, schoolCode, force ? 'refresh' : 'local-first')
      setCourses(snapshot.data)
      setIsStale(snapshot.isStale)
      if (!force && snapshot.isFromLocal) {
        const refreshed = await getProgramSnapshot(session.educationId, schoolCode, 'refresh')
        setCourses(refreshed.data)
        setIsStale(refreshed.isStale)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('programLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [schoolCode, session, t])

  useEffect(() => { void load() }, [load])
  usePullDownRefresh(() => { void load(true).finally(() => Taro.stopPullDownRefresh()) })

  const groups = useMemo(() => groupProgramTerms(courses), [courses])
  const active = groups.find((group) => group.term === activeTerm) ?? groups[0]

  // 数据回来后默认停在第一个学期；切换学校/账号时旧的 term 会失效，这里兜底。
  useEffect(() => {
    if (groups.length > 0 && !groups.some((group) => group.term === activeTerm)) {
      setActiveTerm(groups[0].term)
    }
  }, [groups, activeTerm])

  return (
    <PageShell
      title={t('programLabel')}
      showBack
      action={
        <View className='icon-action pressable' onClick={() => void load(true)}>
          <AppIcon name='refresh' size={20} />
        </View>
      }
    >
      {!session ? (
        <StateView
          state='login'
          title={t('guestMode')}
          description={t('guestModeSubtitle')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      ) : loading && courses.length === 0 ? (
        <StateView state='loading' title={t('programLoading')} description={t('programLoadingSubtitle')} />
      ) : error && courses.length === 0 ? (
        <StateView
          state='error'
          title={t('programLoadFailed')}
          description={describeError(error, t)}
          actionLabel={t('retry')}
          onAction={() => void load(true)}
        />
      ) : courses.length === 0 ? (
        <StateView state='empty' title={t('programNoData')} />
      ) : (
        <>
          <ScrollView className='program-terms' scrollX enableFlex>
            <View className='program-terms__row'>
              {groups.map((group) => (
                <View
                  key={group.term}
                  className={`program-term pressable ${group.term === active?.term ? 'program-term--active' : ''}`}
                  onClick={() => setActiveTerm(group.term)}
                >
                  {programTermLabel(group.term, t)}
                </View>
              ))}
            </View>
          </ScrollView>

          <View className='page-section'>
            {error || isStale ? <View className='page-note'>{t('programRefreshFailed')}</View> : null}

            <ClubCard padding='none'>
              {(active?.courses ?? []).map((course) => (
                <ProgramRow key={course.id} course={course} creditsLabel={t('creditUnit', { credit: course.credits.toFixed(1) })} />
              ))}
            </ClubCard>
          </View>
        </>
      )}
    </PageShell>
  )
}

function ProgramRow({ course, creditsLabel }: { course: PlanCourse; creditsLabel: string }) {
  const color = colorForName(course.courseTypeName)
  return (
    <View className='program-row'>
      <View className='program-row__dot' style={{ background: color }} />
      <View className='grow'>
        <Text className='program-row__name'>{course.name}</Text>
        {course.courseTypeName ? <Text className='program-row__meta'>{course.courseTypeName}</Text> : null}
      </View>
      <Text className='program-row__credit' style={{ color, background: `${color}26` }}>{creditsLabel}</Text>
    </View>
  )
}

export default function ProgramPage() {
  const t = useTranslation()
  return <FeatureGuard feature='program' title={t('programLabel')}><ProgramContent /></FeatureGuard>
}
