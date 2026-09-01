import { useState } from 'react'
import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react-taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { StateView } from '@/components/common/StateView'
import { AppIcon } from '@/components/common/AppIcon'
import { useCourseStore } from '@/stores/course'
import type { Course } from '@/types/domain'
import '@/styles/pages.scss'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const SLOTS = Array.from({ length: 13 }, (_, index) => `第 ${index + 1} 节`)
const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#af52de', '#ff2d55']

interface CourseForm {
  id: string
  name: string
  teacher: string
  location: string
  weeksText: string
  day: number
  start: number
  end: number
  color: string
}

const EMPTY_FORM: CourseForm = { id: '', name: '', teacher: '', location: '', weeksText: '1-20', day: 1, start: 1, end: 2, color: COLORS[0] }

function parseWeeks(value: string): number[] {
  const weeks = new Set<number>()
  for (const part of value.split(/[,，\s]+/)) {
    const range = /^(\d+)-(\d+)$/.exec(part)
    if (range) {
      const start = Math.max(1, Number(range[1]))
      const end = Math.min(30, Number(range[2]))
      for (let week = start; week <= end; week += 1) weeks.add(week)
    } else {
      const week = Number(part)
      if (week >= 1 && week <= 30) weeks.add(week)
    }
  }
  return [...weeks].sort((left, right) => left - right)
}

export default function CustomCoursePage() {
  const courses = useCourseStore((state) => state.customCourses)
  const save = useCourseStore((state) => state.saveCustomCourse)
  const remove = useCourseStore((state) => state.removeCustomCourse)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM)

  const openForm = (course?: Course) => {
    setForm(course ? {
      id: course.id,
      name: course.courseName,
      teacher: course.teachers.join('、'),
      location: course.room,
      weeksText: course.weekIndexes.join(','),
      day: course.weekday,
      start: course.startUnit,
      end: course.endUnit,
      color: course.color,
    } : { ...EMPTY_FORM, id: `custom-${Date.now()}`, color: COLORS[courses.length % COLORS.length] })
    setVisible(true)
  }

  const submit = () => {
    const weeks = parseWeeks(form.weeksText)
    if (!form.name.trim() || weeks.length === 0 || form.end < form.start) {
      Taro.showToast({ title: '请填写课程名、有效周次和节次', icon: 'none' })
      return
    }
    save({
      id: form.id,
      weekIndexes: weeks,
      teachers: form.teacher.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
      room: form.location.trim(),
      courseName: form.name.trim(),
      courseCode: '',
      weekday: form.day,
      startUnit: form.start,
      endUnit: form.end,
      credits: '',
      lessonId: form.id,
      campus: '',
      color: form.color,
      isCustom: true,
    })
    setVisible(false)
    Taro.showToast({ title: '课程已保存', icon: 'success' })
  }

  const action = <View className='icon-action pressable' onClick={() => openForm()}><AppIcon name='add' size={21} /></View>

  return (
    <PageShell title='自定义课程' showBack action={action}>
      <View className='page-section'>
        <ClubCard padding='none'>
          {courses.length === 0 ? <StateView state='empty' title='还没有自定义课程' description='适合游客课表或教务系统外的课程' actionLabel='添加课程' onAction={() => openForm()} /> : courses.map((course) => <ListRow key={course.id} title={course.courseName} subtitle={`${DAYS[course.weekday - 1]} · 第 ${course.startUnit}-${course.endUnit} 节 · ${course.room || '未填写地点'}`} icon='calendar' iconColor={course.color} onClick={() => openForm(course)} />)}
        </ClubCard>
      </View>

      <Dialog title={courses.some((course) => course.id === form.id) ? '编辑课程' : '添加课程'} visible={visible} footer={null} onClose={() => setVisible(false)}>
        <View className='dialog-form'>
          <Text className='form-label'>课程名称</Text><Input className='form-input' value={form.name} maxlength={40} onInput={(event) => setForm((current) => ({ ...current, name: event.detail.value }))} />
          <Text className='form-label'>教师</Text><Input className='form-input' value={form.teacher} maxlength={30} onInput={(event) => setForm((current) => ({ ...current, teacher: event.detail.value }))} />
          <Text className='form-label'>地点</Text><Input className='form-input' value={form.location} maxlength={40} onInput={(event) => setForm((current) => ({ ...current, location: event.detail.value }))} />
          <Text className='form-label'>周次（如 1-8,10,12）</Text><Input className='form-input' value={form.weeksText} maxlength={80} onInput={(event) => setForm((current) => ({ ...current, weeksText: event.detail.value }))} />
          <View className='custom-course__pickers'>
            <Picker mode='selector' range={DAYS} value={form.day - 1} onChange={(event) => setForm((current) => ({ ...current, day: Number(event.detail.value) + 1 }))}><View><Text className='form-label'>星期</Text><View className='form-picker'>{DAYS[form.day - 1]}</View></View></Picker>
            <Picker mode='selector' range={SLOTS} value={form.start - 1} onChange={(event) => setForm((current) => ({ ...current, start: Number(event.detail.value) + 1 }))}><View><Text className='form-label'>开始</Text><View className='form-picker'>{SLOTS[form.start - 1]}</View></View></Picker>
            <Picker mode='selector' range={SLOTS} value={form.end - 1} onChange={(event) => setForm((current) => ({ ...current, end: Number(event.detail.value) + 1 }))}><View><Text className='form-label'>结束</Text><View className='form-picker'>{SLOTS[form.end - 1]}</View></View></Picker>
          </View>
          <View className='dialog-actions'>
            {courses.some((course) => course.id === form.id) ? <Button className='danger-button' onClick={() => { remove(form.id); setVisible(false) }}>删除</Button> : <Button className='secondary-button' onClick={() => setVisible(false)}>取消</Button>}
            <Button className='primary-button' onClick={submit}>保存</Button>
          </View>
        </View>
      </Dialog>
    </PageShell>
  )
}
