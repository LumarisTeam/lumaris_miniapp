import { useEffect, useMemo, useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { fetchScores, fetchSemesters } from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import type { Score, Semester } from '@/types/domain'
import { calculateScoreSummary } from '@/utils/education'
import '@/styles/pages.scss'
import './index.scss'

export default function ScorePage() {
  const session = useAuthStore((state) => state.session)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selected, setSelected] = useState(0)
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (semesterIndex = selected) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      let available = semesters
      if (available.length === 0) {
        available = await fetchSemesters(session.studentId)
        setSemesters(available)
      }
      const semester = available[semesterIndex] ?? available[0]
      if (!semester) {
        setScores([])
        return
      }
      setScores(await fetchScores(session.studentId, semester.value))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '成绩加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    let active = true
    const initialLoad = async () => {
      setLoading(true)
      setError('')
      try {
        const available = await fetchSemesters(session.studentId)
        if (!active) return
        setSemesters(available)
        const first = available[0]
        setScores(first ? await fetchScores(session.studentId, first.value) : [])
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : '成绩加载失败')
      } finally {
        if (active) setLoading(false)
      }
    }
    void initialLoad()
    return () => { active = false }
  }, [session])
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })
  const summary = useMemo(() => calculateScoreSummary(scores), [scores])

  if (!session) {
    return <PageShell title='成绩'><StateView state='login' title='登录后查看成绩' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /></PageShell>
  }

  return (
    <PageShell title='成绩'>
      <View className='page-section'>
        <ClubCard>
          <View className='row row--between'>
            <View><Text className='hero-title'>{summary.weightedGpa.toFixed(2)}</Text><Text className='hero-subtitle'>加权平均绩点</Text></View>
            <Picker
              mode='selector'
              range={semesters.map((semester) => semester.text)}
              value={selected}
              onChange={(event) => {
                const next = Number(event.detail.value)
                setSelected(next)
                void load(next)
              }}
            >
              <View className='score-semester pressable'>{semesters[selected]?.text || '选择学期'} <AppIconFallback /></View>
            </Picker>
          </View>
          <View className='metric-grid score-metrics'>
            <View className='metric'><Text className='metric__value'>{summary.credits.toFixed(1)}</Text><Text className='metric__label'>总学分</Text></View>
            <View className='metric'><Text className='metric__value'>{summary.average.toFixed(1)}</Text><Text className='metric__label'>平均分</Text></View>
            <View className='metric'><Text className='metric__value'>{scores.length}</Text><Text className='metric__label'>课程数</Text></View>
          </View>
        </ClubCard>
      </View>
      <View className='page-section'>
        <SectionHeader title='课程成绩' icon='list' trailing={`${scores.length} 门`} />
        <ClubCard padding='none'>
          {loading && scores.length === 0 ? <StateView state='loading' compact title='正在读取成绩' /> : error ? <StateView state='error' compact title='成绩加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : scores.length === 0 ? <StateView state='empty' compact title='本学期暂无成绩' /> : scores.map((score) => (
            <View className='score-row pressable' key={score.id} onClick={() => Taro.showModal({ title: score.lessonName, content: `成绩：${score.grade}\n绩点：${score.gpa.toFixed(2)}\n学分：${score.credit.toFixed(1)}${score.gradeDetail ? `\n${score.gradeDetail}` : ''}`, showCancel: false })}>
              <View className='grow'><View className='row'><Text className='score-row__name'>{score.lessonName}</Text>{score.isMinor ? <Text className='tag'>辅修</Text> : null}</View><Text className='score-row__meta'>{score.lessonCode || '课程'} · {score.credit.toFixed(1)} 学分</Text></View>
              <View className='score-row__grade'><Text>{score.grade}</Text><Text>GPA {score.gpa.toFixed(2)}</Text></View>
            </View>
          ))}
        </ClubCard>
      </View>
    </PageShell>
  )
}

function AppIconFallback() {
  return <Text className='score-semester__arrow'>›</Text>
}
