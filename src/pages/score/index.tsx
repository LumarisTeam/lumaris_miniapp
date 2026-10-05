import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, Text, View, type ITouchEvent } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { Dialog, Popup } from '@nutui/nutui-react-taro'
import { AppIcon } from '@/components/common/AppIcon'
import { ListRow } from '@/components/common/ListRow'
import { PageShell } from '@/components/common/PageShell'
import { StateView } from '@/components/common/StateView'
import { ScoreDetailSheet } from '@/components/score/ScoreDetailSheet'
import { ScoreRow } from '@/components/score/ScoreRow'
import { ScoreStatsCard } from '@/components/score/ScoreStatsCard'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useScoreStore } from '@/stores/score'
import { useTranslation } from '@/i18n'
import {
  academicYearKey,
  applyFoolishMode,
  buildSemesterLabels,
  calculateScoreListsSummary,
  calculateScoreSummary,
  groupByAcademicYear,
} from '@/utils/education'
import type { Score } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

/** 横滑切换学期的触发距离（设备像素）与方向判定比例。 */
const SWIPE_MIN_DISTANCE = 60
const SWIPE_DIRECTION_RATIO = 1.5

/** 超过这个数量就不再平铺分段控件，改用下拉，与 Flutter 一致。 */
const SEGMENTED_LIMIT = 4

type ScoreMode = 'semester' | 'year'

export default function ScorePage() {
  const t = useTranslation()
  const session = useAuthStore((state) => state.session)
  const school = useAppStore((state) => state.school)
  const scoreLists = useScoreStore((state) => state.scoreLists)
  const loading = useScoreStore((state) => state.loading)
  const error = useScoreStore((state) => state.error)
  const isStale = useScoreStore((state) => state.isStale)
  const load = useScoreStore((state) => state.load)

  const [mode, setMode] = useState<ScoreMode>('semester')
  const [selected, setSelected] = useState(0)
  const [foolish, setFoolish] = useState(false)
  const [detail, setDetail] = useState<Score | null>(null)
  const [creditInfoVisible, setCreditInfoVisible] = useState(false)
  const [selectorVisible, setSelectorVisible] = useState(false)

  const canGradeQuery = school.features.includes('grade_query')
  const canGpa = school.features.includes('gpa_calculation')
  const canLoad = Boolean(session) && canGradeQuery

  useEffect(() => {
    if (canLoad) void load(session!.educationId)
  }, [canLoad, session, load])

  usePullDownRefresh(() => {
    if (!canLoad) {
      Taro.stopPullDownRefresh()
      return
    }
    refresh(true).finally(() => Taro.stopPullDownRefresh())
  })

  /** 刷新会退出愚人模式，与 Flutter 的 refresh 行为一致。 */
  const refresh = (force: boolean) => {
    setFoolish(false)
    return load(session!.educationId, force ? 'refresh' : 'local-first')
  }

  // 愚人模式直接作用在展示数据上，所以统计卡也跟着变——Flutter 是原地改模型，
  // 两边口径必须一致，否则会出现「列表 5.0、GPA 还是 2.3」。
  const displayLists = useMemo(
    () => (foolish ? applyFoolishMode(scoreLists) : scoreLists),
    [foolish, scoreLists],
  )
  const yearLists = useMemo(() => groupByAcademicYear(displayLists), [displayLists])
  const activeLists = mode === 'year' ? yearLists : displayLists

  const labels = useMemo(
    () =>
      mode === 'year'
        ? activeLists.map((_, index) => t(academicYearKey(index)))
        : buildSemesterLabels(activeLists.length, t),
    [mode, activeLists, t],
  )

  const activeIndex = Math.min(selected, Math.max(0, activeLists.length - 1))
  const active = activeLists[activeIndex]
  const overall = useMemo(() => calculateScoreListsSummary(displayLists), [displayLists])
  const activeSummary = useMemo(() => calculateScoreSummary(active?.list ?? []), [active])

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
    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE) return
    if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_DIRECTION_RATIO) return

    const next = activeIndex + (deltaX < 0 ? 1 : -1)
    setSelected(Math.min(activeLists.length - 1, Math.max(0, next)))
  }

  const enterFoolishMode = () => {
    setFoolish(true)
    Taro.showToast({ title: t('foolishModeMessage'), icon: 'none' })
  }

  if (!canGradeQuery) {
    return <PageShell title={t('scoresAndGpa')}><StateView state='empty' title={t('schoolNotSupported')} /></PageShell>
  }
  if (!session) {
    return (
      <PageShell title={t('scoresAndGpa')}>
        <StateView
          state='login'
          title={t('notLoggedIn')}
          description={t('pleaseLoginFirst')}
          actionLabel={t('goToLogin')}
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      </PageShell>
    )
  }
  if (loading && scoreLists.length === 0) {
    return (
      <PageShell title={t('scoresAndGpa')}>
        <StateView state='loading' title={t('fetchingScores')} description={t('readingScoresSubtitle')} />
      </PageShell>
    )
  }

  const action = (
    <View className='score-actions'>
      {!foolish ? (
        <View className='icon-action pressable' onClick={enterFoolishMode}>
          <AppIcon name='success' size={20} />
        </View>
      ) : null}
      <View className='icon-action pressable' onClick={() => void refresh(true)}>
        <AppIcon name='refresh' size={20} />
      </View>
    </View>
  )

  return (
    <PageShell title={t('scoresAndGpa')} action={action} className='score-page'>
      {isStale ? <View className='page-note score-stale'>刷新失败，当前显示本地缓存</View> : null}

      {scoreLists.length === 0 ? (
        <StateView
          state={error ? 'error' : 'empty'}
          title={error ? t('loadFailed') : t('noScores')}
          description={error || t('noScoresSubtitle')}
          actionLabel={t('refreshDataBtn')}
          onAction={() => void refresh(true)}
        />
      ) : (
        <>
          <View className='score-overall'>
            <ScoreStatsCard
              summary={overall}
              canGpa={canGpa}
              onShowCreditInfo={() => setCreditInfoVisible(true)}
            />
          </View>

          <View className='score-controls'>
            <View
              className='score-mode-toggle pressable'
              onClick={() => {
                setMode((value) => (value === 'semester' ? 'year' : 'semester'))
                setSelected(0)
              }}
            >
              <AppIcon name={mode === 'semester' ? 'calendar' : 'category'} size={20} />
            </View>

            {labels.length >= 2 ? (
              labels.length > SEGMENTED_LIMIT ? (
                <View className='score-dropdown pressable' onClick={() => setSelectorVisible(true)}>
                  <Text className='score-dropdown__text'>{labels[activeIndex]}</Text>
                  <AppIcon name='right' size={16} color='var(--secondary-label)' />
                </View>
              ) : (
                <View className='segmented'>
                  {labels.map((label, index) => (
                    <View
                      className={`segmented__item pressable ${index === activeIndex ? 'segmented__item--active' : ''}`}
                      key={label}
                      onClick={() => setSelected(index)}
                    >
                      {label}
                    </View>
                  ))}
                </View>
              )
            ) : null}
          </View>

          <ScrollView
            scrollY
            enhanced
            showScrollbar={false}
            className='score-scroll'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {mode === 'year' && active ? (
              <View className='score-overall'>
                <ScoreStatsCard
                  summary={activeSummary}
                  canGpa={canGpa}
                  onShowCreditInfo={() => setCreditInfoVisible(true)}
                />
              </View>
            ) : null}

            <View className='score-list'>
              {(active?.list ?? []).map((score) => (
                <ScoreRow key={score.id} score={score} canGpa={canGpa} onTap={() => setDetail(score)} />
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <Popup visible={selectorVisible} position='bottom' round onClose={() => setSelectorVisible(false)}>
        <View className='score-selector-sheet'>
          <Text className='score-selector-sheet__title'>{t('scoresAndGpa')}</Text>
          <ScrollView scrollY className='score-selector-sheet__list'>
            {labels.map((label, index) => (
              <ListRow
                key={label}
                title={label}
                icon={index === activeIndex ? 'check' : undefined}
                onClick={() => {
                  setSelected(index)
                  setSelectorVisible(false)
                }}
              />
            ))}
          </ScrollView>
        </View>
      </Popup>

      <Dialog
        title={t('creditInfoTitle')}
        visible={creditInfoVisible}
        footer={null}
        onClose={() => setCreditInfoVisible(false)}
      >
        <Text className='score-credit-info'>{t('creditInfoContent')}</Text>
      </Dialog>

      <ScoreDetailSheet
        score={detail}
        canGpa={canGpa}
        visible={detail !== null}
        onClose={() => setDetail(null)}
      />
    </PageShell>
  )
}
