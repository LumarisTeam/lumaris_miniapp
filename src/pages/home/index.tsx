import { useMemo, useState } from 'react'
import { Button, Checkbox, Input, Picker, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react-taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { CourseCard } from '@/components/course/CourseCard'
import { HomeServiceTile, type HomeServiceTileTone } from '@/components/home/HomeServiceTile'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useAppStore } from '@/stores/app'
import { useTodoStore } from '@/stores/todo'
import type { Exam, Feature, ServiceType, TodoItem } from '@/types/domain'
import { getHomeCourses } from '@/utils/education'
import { getExamSnapshot, readExamSnapshot } from '@/services/examRepository'
import '@/styles/pages.scss'
import './index.scss'

const SERVICE_ROUTES: Record<ServiceType, { label: string; value: string; route: string; icon: 'power' | 'service' | 'card'; tone: HomeServiceTileTone; feature: Feature }> = {
  electricity: { label: '电费', value: '余额与趋势', route: '/subpackages/services/electricity/index', icon: 'power', tone: 'primary', feature: 'electricity' },
  bus: { label: '校车', value: '今日班次', route: '/subpackages/services/bus/index', icon: 'service', tone: 'success', feature: 'bus_schedule' },
  payment: { label: '校园卡', value: '余额与流水', route: '/subpackages/services/payment/index', icon: 'card', tone: 'warning', feature: 'payment' },
}

export default function HomePage() {
  const session = useAuthStore((state) => state.session)
  const settings = useAppStore((state) => state.settings)
  const school = useAppStore((state) => state.school)
  const courses = useCourseStore((state) => state.courses)
  const customCourses = useCourseStore((state) => state.customCourses)
  const ignoredNames = useCourseStore((state) => state.ignoredCourseNames)
  const timeInfo = useCourseStore((state) => state.timeInfo)
  const refreshCourses = useCourseStore((state) => state.refresh)
  const loading = useCourseStore((state) => state.loading)
  const todos = useTodoStore((state) => state.todos)
  const addTodo = useTodoStore((state) => state.add)
  const updateTodo = useTodoStore((state) => state.update)
  const toggleTodo = useTodoStore((state) => state.toggle)
  const removeTodo = useTodoStore((state) => state.remove)
  const examScope = session ? `${school.code.toUpperCase()}:${session.educationId}` : ''
  const [exams, setExams] = useState<Exam[]>(() => {
    if (!examScope) return []
    return readExamSnapshot(session!.educationId, school.code).data
  })
  const [todoDialog, setTodoDialog] = useState(false)
  const [todoTitle, setTodoTitle] = useState('')
  const [todoDate, setTodoDate] = useState(new Date().toISOString().slice(0, 10))
  const [todoTime, setTodoTime] = useState('23:59')
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)

  const sync = async () => {
    if (!session) return
    const [, examResult] = await Promise.allSettled([
      school.features.includes('timetable') ? refreshCourses(session.educationId) : Promise.resolve(),
      school.features.includes('exam_schedule') ? getExamSnapshot(session.educationId, school.code, 'refresh') : Promise.resolve({ data: [], isFromLocal: false, isStale: false }),
    ])
    if (examResult.status === 'fulfilled') {
      setExams(examResult.value.data)
    }
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
  const scheduleTitle = homeSchedule.isTomorrow ? '明日课程' : '今日课程'
  const upcomingExams = exams.slice(0, 3)
  const homeServices = settings.visibleServices.filter((service) => school.features.includes(SERVICE_ROUTES[service].feature))

  const submitTodo = () => {
    if (!todoTitle.trim()) {
      Taro.showToast({ title: '请输入待办内容', icon: 'none' })
      return
    }
    const deadline = `${todoDate} ${todoTime}`
    if (editingTodo) {
      updateTodo({ ...editingTodo, title: todoTitle.trim(), deadline })
    } else {
      addTodo(todoTitle, deadline)
    }
    setTodoTitle('')
    setEditingTodo(null)
    setTodoDialog(false)
  }

  const openTodoDialog = (todo?: TodoItem) => {
    setEditingTodo(todo ?? null)
    setTodoTitle(todo?.title ?? '')
    const [date = new Date().toISOString().slice(0, 10), time = '23:59'] = todo?.deadline.split(' ') ?? []
    setTodoDate(date)
    setTodoTime(time)
    setTodoDialog(true)
  }

  return (
    <PageShell title='光序'>
      <View className='page-section'>
        <SectionHeader title={scheduleTitle} icon='calendar' trailing={`${now.getMonth() + 1}月${now.getDate()}日`} />
        {!session ? (
          <ClubCard><StateView state='login' compact title='登录后查看课程表' actionLabel='去登录' onAction={() => Taro.navigateTo({ url: '/pages/login/index' })} /></ClubCard>
        ) : loading && visibleCourses.length === 0 ? (
          <ClubCard><StateView state='loading' compact title='正在同步课表' /></ClubCard>
        ) : todayCourses.length === 0 ? (
          <ClubCard><StateView state='empty' compact title='没有待上的课程' description='享受一段自由时间吧' /></ClubCard>
        ) : (
          <View className='stack'>{todayCourses.map((course) => <CourseCard course={course} key={course.id} />)}</View>
        )}
      </View>

      {session && homeServices.length > 0 ? (
        <View className='page-section'>
          <SectionHeader title='快捷方式' icon='service' />
          <View className='home-service-grid'>
            {homeServices.map((service) => {
              const item = SERVICE_ROUTES[service]
              return (
                <HomeServiceTile
                  key={service}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  tone={item.tone}
                  onClick={() => Taro.navigateTo({ url: item.route })}
                />
              )
            })}
          </View>
        </View>
      ) : null}

      {session ? (
        <View className='page-section'>
          <SectionHeader title='考试安排' icon='book' />
          <ClubCard padding='none'>
            {upcomingExams.length === 0 ? <StateView state='empty' compact title='暂无考试安排' /> : upcomingExams.map((exam) => (
              <View className='home-exam' key={exam.id}>
                <View className='home-exam__date'><AppIcon name='clock' size={20} color='var(--warning)' /></View>
                <View className='grow'><Text className='home-exam__name'>{exam.name}</Text><Text className='home-exam__meta'>{exam.time}</Text><Text className='home-exam__meta'>{exam.location}{exam.seat ? ` · ${exam.seat}` : ''}</Text></View>
              </View>
            ))}
          </ClubCard>
        </View>
      ) : null}

      <View className='page-section'>
        <View className='row row--between'>
          <SectionHeader title='待办事项' icon='check' />
          <View className='icon-action pressable' onClick={() => openTodoDialog()}><AppIcon name='add' size={21} /></View>
        </View>
        <ClubCard padding='none'>
          {todos.length === 0 ? <StateView state='empty' compact title='暂无待办事项' description='添加一项，让今天更有条理' /> : todos.map((todo) => {
            const expired = !todo.isCompleted && new Date(todo.deadline.replace(' ', 'T')).getTime() < Date.now()
            return (
              <View className='home-todo' key={todo.id}>
                <Checkbox value={todo.id} checked={todo.isCompleted} onClick={() => toggleTodo(todo.id)} />
                <View className='grow' onClick={() => openTodoDialog(todo)}>
                  <Text className={`home-todo__title ${todo.isCompleted ? 'home-todo__title--done' : ''}`}>{todo.title}</Text>
                  <Text className={`home-todo__deadline ${expired ? 'danger' : ''}`}>{expired ? '已到期 · ' : ''}{todo.deadline}</Text>
                </View>
                <View className='home-todo__delete pressable' onClick={() => removeTodo(todo.id)}><AppIcon name='delete' size={18} color='var(--danger)' /></View>
              </View>
            )
          })}
        </ClubCard>
      </View>

      <Dialog title={editingTodo ? '编辑待办' : '添加待办'} visible={todoDialog} footer={null} onClose={() => { setTodoDialog(false); setEditingTodo(null) }}>
        <View className='dialog-form'>
          <Text className='form-label'>待办内容</Text>
          <Input className='form-input' value={todoTitle} maxlength={40} placeholder='例如：提交实验报告' onInput={(event) => setTodoTitle(event.detail.value)} />
          <Text className='form-label'>截止日期</Text>
          <Picker mode='date' value={todoDate} onChange={(event) => setTodoDate(String(event.detail.value))}>
            <View className='form-picker'>{todoDate}</View>
          </Picker>
          <Text className='form-label'>截止时间</Text>
          <Picker mode='time' value={todoTime} onChange={(event) => setTodoTime(String(event.detail.value))}>
            <View className='form-picker'>{todoTime}</View>
          </Picker>
          <View className='dialog-actions'>
            <Button className='secondary-button' onClick={() => { setTodoDialog(false); setEditingTodo(null) }}>取消</Button>
            <Button className='primary-button' onClick={submitTodo}>{editingTodo ? '保存' : '添加'}</Button>
          </View>
        </View>
      </Dialog>
    </PageShell>
  )
}
