import { useEffect, useMemo, useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AppIcon } from '@/components/common/AppIcon'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useScoreStore } from '@/stores/score'
import type { Score, ScoreList } from '@/types/domain'
import { academicYearLabel, buildSemesterLabels, calculateScoreListsSummary, calculateScoreSummary } from '@/utils/education'
import '@/styles/pages.scss'
import './index.scss'

type ScoreMode = 'semester' | 'year'

function groupByAcademicYear(scoreLists: ScoreList[]): ScoreList[] {
  const years: ScoreList[] = []
  for (let index = scoreLists.length - 1; index >= 0; index -= 1) {
    const offset = scoreLists.length - 1 - index
    const scoreList = scoreLists[index]
    if (offset % 2 === 0) {
      years.push({ semester: scoreList.semester, list: [...scoreList.list] })
    } else {
      years[years.length - 1]?.list.push(...scoreList.list)
    }
  }
  return years
}

export default function ScorePage() {
  const session = useAuthStore((state) => state.session)
  const school = useAppStore((state) => state.school)
  const scoreLists = useScoreStore((state) => state.scoreLists)
  const loading = useScoreStore((state) => state.loading)
  const refreshing = useScoreStore((state) => state.refreshing)
  const error = useScoreStore((state) => state.error)
  const isStale = useScoreStore((state) => state.isStale)
  const load = useScoreStore((state) => state.load)
  const [mode, setMode] = useState<ScoreMode>('semester')
  const [selected, setSelected] = useState(0)
  const [foolish, setFoolish] = useState(false)

  useEffect(() => {
    if (session && school.features.includes('grade_query')) void load(session.educationId)
  }, [session, school.features, load])
  usePullDownRefresh(() => {
    if (!session || !school.features.includes('grade_query')) return Taro.stopPullDownRefresh()
    void load(session.educationId, 'refresh').finally(() => Taro.stopPullDownRefresh())
  })

  const displayLists = useMemo(() => mode === 'year' ? groupByAcademicYear(scoreLists) : scoreLists, [mode, scoreLists])
  const activeIndex = Math.min(selected, Math.max(0, displayLists.length - 1))
  const active = displayLists[activeIndex]
  const overall = useMemo(() => calculateScoreListsSummary(scoreLists), [scoreLists])
  const activeSummary = useMemo(() => calculateScoreSummary(active?.list ?? []), [active])
  const labels = mode === 'year' ? displayLists.map((_, index) => academicYearLabel(index)) : buildSemesterLabels(displayLists.length)
  const canGpa = school.features.includes('gpa_calculation')
  const visibleScores = foolish
    ? (active?.list ?? []).map((score) => ({ ...score, grade: '100', gpa: '5' }))
    : active?.list ?? []

  if (!school.features.includes('grade_query')) {
    return <PageShell title='成绩'><StateView state='empty' title='当前学校暂不支持成绩查询' /></PageShell>
  }
  if (!session) {
    return <PageShell title='成绩'><StateView state='login' title='尚未登录' description='请先登录教务系统' actionLabel='前往登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /></PageShell>
  }
  if (loading && scoreLists.length === 0) {
    return <PageShell title='成绩'><StateView state='loading' title='正在获取成绩' description='正在读取本地成绩并同步教务系统' /></PageShell>
  }

  const action = (
    <View className='score-actions'>
      {!foolish ? <View className='icon-action pressable' onClick={() => { setFoolish(true); Taro.showToast({ title: '愚人模式已开启', icon: 'none' }) }}><AppIcon name='success' size={20} /></View> : null}
      <View className='icon-action pressable' onClick={() => void load(session.educationId, 'refresh')}><AppIcon name='refresh' size={20} /></View>
    </View>
  )

  return (
    <PageShell title='成绩与绩点' action={action}>
      {isStale ? <View className='page-note score-stale'>刷新失败，当前显示本地缓存</View> : null}
      <View className='page-section'>
        <ClubCard>
          <View className='metric-grid'>
            {canGpa ? <View className='metric'><Text className='metric__value'>{overall.weightedGpa.toFixed(2)}</Text><Text className='metric__label'>GPA</Text></View> : null}
            <View className='metric'><Text className='metric__value'>{overall.courses}</Text><Text className='metric__label'>通过课程</Text></View>
            <View className='metric'><Text className='metric__value'>{overall.credits.toFixed(1)}</Text><Text className='metric__label'>总学分</Text></View>
          </View>
        </ClubCard>
      </View>

      <View className='page-section score-controls'>
        <View className='icon-action pressable' onClick={() => setMode((value) => value === 'semester' ? 'year' : 'semester')}><AppIcon name={mode === 'semester' ? 'calendar' : 'category'} size={20} /></View>
        {labels.length > 0 ? (
          <Picker mode='selector' range={labels} value={activeIndex} onChange={(event) => setSelected(Number(event.detail.value))}>
            <View className='score-semester pressable'>{labels[activeIndex]} <Text className='score-semester__arrow'>›</Text></View>
          </Picker>
        ) : null}
      </View>

      {error && scoreLists.length === 0 ? (
        <StateView state='error' title='成绩加载失败' description={error} actionLabel='重试' onAction={() => void load(session.educationId, 'refresh')} />
      ) : !active ? (
        <StateView state='empty' title='暂无成绩' description='可以刷新后重试' actionLabel='刷新数据' onAction={() => void load(session.educationId, 'refresh')} />
      ) : (
        <View className='page-section'>
          {mode === 'year' ? (
            <ClubCard>
              <View className='metric-grid'>
                {canGpa ? <View className='metric'><Text className='metric__value'>{activeSummary.weightedGpa.toFixed(2)}</Text><Text className='metric__label'>学年 GPA</Text></View> : null}
                <View className='metric'><Text className='metric__value'>{activeSummary.courses}</Text><Text className='metric__label'>通过课程</Text></View>
                <View className='metric'><Text className='metric__value'>{activeSummary.credits.toFixed(1)}</Text><Text className='metric__label'>学年学分</Text></View>
              </View>
            </ClubCard>
          ) : null}
          <SectionHeader title='课程成绩' icon='list' trailing={refreshing ? '同步中' : `${visibleScores.length} 门`} />
          <ClubCard padding='none'>
            {visibleScores.map((score) => <ScoreRow key={score.id} score={score} canGpa={canGpa} />)}
          </ClubCard>
        </View>
      )}
    </PageShell>
  )
}

function ScoreRow({ score, canGpa }: { score: Score; canGpa: boolean }) {
  return (
    <View className='score-row pressable' onClick={() => Taro.showModal({ title: score.name, content: `成绩：${score.grade}\n绩点：${score.gpa}\n学分：${score.credit}${score.gradeDetail ? `\n${score.gradeDetail}` : ''}`, showCancel: false })}>
      <View className='grow'>
        <View className='row'><Text className='score-row__name'>{score.name}{score.isMinor ? '（辅修）' : ''}</Text></View>
        <Text className='score-row__meta'>{score.credit} 学分{canGpa ? ` · GPA ${score.gpa}` : ''}</Text>
      </View>
      <View className='score-row__grade'><Text>{score.grade}</Text></View>
    </View>
  )
}
