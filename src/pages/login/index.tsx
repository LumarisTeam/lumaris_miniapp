import { useEffect, useState } from 'react'
import { Button, Image, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

export default function LoginPage() {
  const schools = useAppStore((state) => state.schools)
  const loadSchools = useAppStore((state) => state.loadSchools)
  const setSchool = useAppStore((state) => state.setSchool)
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const [schoolIndex, setSchoolIndex] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { void loadSchools() }, [loadSchools])

  const submit = async () => {
    if (!username.trim() || !password) {
      Taro.showToast({ title: '请输入学号和密码', icon: 'none' })
      return
    }
    const school = schools[schoolIndex] || schools[0]
    if (!school) return
    const success = await login(username, password, school)
    if (success) {
      setSchool(school)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 350)
    }
  }

  return (
    <PageShell title='登录' showBack className='login-page'>
      <View className='login-brand'><Image className='login-brand__logo' src={logo} mode='aspectFit' /><Text className='login-brand__title'>光序</Text><Text className='login-brand__subtitle'>连接你的校园生活</Text></View>
      <View className='page-section'>
        <ClubCard>
          <Text className='form-label'>学校</Text>
          <Picker mode='selector' range={schools.map((school) => school.name)} value={schoolIndex} onChange={(event) => setSchoolIndex(Number(event.detail.value))}>
            <View className='form-picker'>{schools[schoolIndex]?.name || '选择学校'}</View>
          </Picker>
          <Text className='form-label'>学号</Text>
          <Input className='form-input' value={username} placeholder='请输入学号' maxlength={24} onInput={(event) => setUsername(event.detail.value)} />
          <Text className='form-label'>密码</Text>
          <Input className='form-input' value={password} password placeholder='请输入教务系统密码' maxlength={64} onInput={(event) => setPassword(event.detail.value)} />
          {error ? <Text className='login-error'>{error}</Text> : null}
          <Button className='primary-button login-submit' loading={loading} disabled={loading} onClick={() => void submit()}>登录</Button>
          <View className='page-note login-note'><Text>为保护账号安全，小程序不会保存教务密码。会话过期后需要重新登录。</Text></View>
        </ClubCard>
      </View>
    </PageShell>
  )
}
