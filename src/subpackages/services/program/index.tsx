import { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { StateView } from '@/components/common/StateView'
import { SectionHeader } from '@/components/common/SectionHeader'
import { fetchProgram } from '@/api/education'
import { useAuthStore } from '@/stores/auth'
import type { PlanCourse } from '@/types/domain'
import '@/styles/pages.scss'
import './index.scss'

export default function ProgramPage() {
  const session = useAuthStore((state) => state.session)
  const [courses, setCourses] = useState<PlanCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try { setCourses(await fetchProgram(session.studentId, session.displayName)) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '培养计划加载失败') }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])
  usePullDownRefresh(() => { void load().finally(() => Taro.stopPullDownRefresh()) })
  const grouped = useMemo(() => courses.reduce<Record<string, PlanCourse[]>>((result, course) => {
    const key = course.term || '未分学期'
    result[key] = [...(result[key] || []), course]
    return result
  }, {}), [courses])
  const credits = courses.reduce((sum, course) => sum + course.credits, 0)

  return (
    <PageShell title='培养计划' showBack>
      {!session ? <StateView state='login' title='登录后查看培养计划' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /> : (
        <>
          <View className='page-section'><ClubCard><View className='metric-grid'><View className='metric'><Text className='metric__value'>{courses.length}</Text><Text className='metric__label'>课程</Text></View><View className='metric'><Text className='metric__value'>{credits.toFixed(1)}</Text><Text className='metric__label'>总学分</Text></View><View className='metric'><Text className='metric__value'>{Object.keys(grouped).length}</Text><Text className='metric__label'>学期</Text></View></View></ClubCard></View>
          {loading && courses.length === 0 ? <StateView state='loading' title='正在读取培养计划' /> : error ? <StateView state='error' title='培养计划加载失败' description={error} actionLabel='重试' onAction={() => void load()} /> : courses.length === 0 ? <StateView state='empty' title='暂无培养计划数据' /> : Object.entries(grouped).map(([term, items]) => (
            <View className='page-section' key={term}><SectionHeader title={term} icon='book' trailing={`${items.reduce((sum, item) => sum + item.credits, 0).toFixed(1)} 学分`} /><ClubCard padding='none'>{items.map((course) => <View className='program-row' key={course.id}><View className='grow'><Text className='program-row__name'>{course.name}</Text><Text className='program-row__meta'>{[course.courseTypeName, course.lessonType, course.examMode].filter(Boolean).join(' · ')}</Text></View><Text className='program-row__credit'>{course.credits.toFixed(1)}</Text></View>)}</ClubCard></View>
          ))}
        </>
      )}
    </PageShell>
  )
}
